import type {
  LaneTemplate,
  BusyTemplate,
  TemplateMap,
  ValidationResult,
  ValidationError,
  Quantity,
} from '../types/index.js';

/** Internal representation of a busy template with absolute timing */
interface ResolvedBusy {
  template: BusyTemplate;
  absoluteStart: number;
  absoluteEnd: number;
}

/**
 * Recursively flattens a lane template into a list of busy templates with absolute offsets.
 * Also validates duration hierarchy and boundary constraints.
 */
function flattenLane(
  lane: LaneTemplate,
  allTemplates: TemplateMap,
  baseOffset: number,
  errors: ValidationError[],
  visited: Set<string>,
): ResolvedBusy[] {
  const result: ResolvedBusy[] = [];

  // Detect circular references
  if (visited.has(lane.id)) {
    return result;
  }
  visited.add(lane.id);

  for (const segment of lane.segments) {
    const template = allTemplates[segment.templateId]; // O(1) lookup

    if (!template) {
      errors.push({
        type: 'missing-template',
        message: `Template "${segment.templateId}" referenced by lane "${lane.intent}" not found`,
        missingTemplateId: segment.templateId,
        referencedBy: lane.id,
      });
      continue;
    }

    // Check for zero duration
    if (template.estimatedDuration <= 0) {
      errors.push({
        type: 'zero-duration',
        message: `Template "${template.intent}" (${template.id}) has zero or negative duration`,
        templateId: template.id,
        templateIntent: template.intent,
      });
      continue;
    }

    // Check double-linking: child must have a reference back to this parent
    const hasBackLink = template.references.some(
      ref => ref.parentId === lane.id && ref.relationshipId === segment.relationshipId
    );
    if (!hasBackLink) {
      errors.push({
        type: 'double-linking-inconsistent',
        message: `Template "${template.intent}" (${template.id}) is missing back-link to parent "${lane.intent}" (${lane.id}) for relationship "${segment.relationshipId}"`,
        parentId: lane.id,
        childId: template.id,
        relationshipId: segment.relationshipId,
        missingSide: 'child',
      });
    }

    // Check for negative offset
    if (segment.offset < 0) {
      errors.push({
        type: 'negative-offset',
        message: `"${template.intent}" has negative offset ${segment.offset}ms in lane "${lane.intent}"`,
        parentId: lane.id,
        parentIntent: lane.intent,
        childId: template.id,
        childIntent: template.intent,
        offset: segment.offset,
      });
      continue;
    }

    // Check duration hierarchy: child duration must be strictly less than parent
    if (template.estimatedDuration >= lane.estimatedDuration) {
      errors.push({
        type: 'duration-hierarchy',
        message: `"${template.intent}" (${template.estimatedDuration}ms) must have duration less than parent "${lane.intent}" (${lane.estimatedDuration}ms)`,
        parentId: lane.id,
        parentIntent: lane.intent,
        parentDuration: lane.estimatedDuration,
        childId: template.id,
        childIntent: template.intent,
        childDuration: template.estimatedDuration,
      });
      continue;
    }

    // Check end time doesn't exceed parent duration
    const endTime = segment.offset + template.estimatedDuration;
    if (endTime > lane.estimatedDuration) {
      errors.push({
        type: 'exceeds-parent-duration',
        message: `"${template.intent}" ends at ${endTime}ms which exceeds parent "${lane.intent}" duration of ${lane.estimatedDuration}ms`,
        parentId: lane.id,
        parentIntent: lane.intent,
        parentDuration: lane.estimatedDuration,
        childId: template.id,
        childIntent: template.intent,
        offset: segment.offset,
        childDuration: template.estimatedDuration,
        endTime,
      });
      continue;
    }

    const absoluteOffset = baseOffset + segment.offset;

    if (template.templateType === 'busy') {
      result.push({
        template,
        absoluteStart: absoluteOffset,
        absoluteEnd: absoluteOffset + template.estimatedDuration,
      });
    } else if (template.templateType === 'lane') {
      // Recursively flatten nested lanes
      const nestedBusies = flattenLane(
        template,
        allTemplates,
        absoluteOffset,
        errors,
        new Set(visited),
      );
      result.push(...nestedBusies);
    }
  }

  return result;
}

/**
 * Checks for overlapping busy templates.
 */
function checkOverlaps(busies: ResolvedBusy[], errors: ValidationError[]): void {
  // Sort by start time
  const sorted = [...busies].sort((a, b) => a.absoluteStart - b.absoluteStart);

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];

      // If b starts after a ends, no overlap
      if (b.absoluteStart >= a.absoluteEnd) {
        continue;
      }

      // There's an overlap
      const overlapStart = Math.max(a.absoluteStart, b.absoluteStart);
      const overlapEnd = Math.min(a.absoluteEnd, b.absoluteEnd);

      errors.push({
        type: 'busy-overlap',
        message: `"${a.template.intent}" and "${b.template.intent}" overlap between ${overlapStart}ms and ${overlapEnd}ms`,
        template1Id: a.template.id,
        template1Intent: a.template.intent,
        template2Id: b.template.id,
        template2Intent: b.template.intent,
        overlapStart,
        overlapEnd,
      });
    }
  }
}

/**
 * Validates state transitions with strict temporal and boundary rules.
 * 
 * Rules:
 * 1. Only the FIRST busy template can have unsatisfied willConsume (becomes contractInputs)
 * 2. Only the LAST busy template can have unsatisfied willProduce (becomes contractOutputs)
 * 3. All internal variables must be produced before they are consumed
 * 
 * Pass-through variables:
 * If a variable appears in both contractInputs and contractOutputs, it is extracted
 * as a pass-through (the lane "borrows" the resource and returns it).
 */
function validateStateTransitions(
  busies: ResolvedBusy[],
  errors: ValidationError[],
): {
  contractInputs: Record<string, Quantity>;
  contractOutputs: Record<string, Quantity>;
  passThroughs: Record<string, Quantity>;
} {
  if (busies.length === 0) {
    return { contractInputs: {}, contractOutputs: {}, passThroughs: {} };
  }

  // Sort by start time for temporal simulation
  const sorted = [...busies].sort((a, b) => a.absoluteStart - b.absoluteStart);

  const firstBusy = sorted[0].template;
  const lastBusy = sorted[sorted.length - 1].template;

  // Track available quantities for each variable
  const available: Map<string, Quantity> = new Map();

  // Contract inputs: consumed by first busy before produced internally
  const contractInputs: Record<string, Quantity> = {};

  for (let i = 0; i < sorted.length; i++) {
    const busy = sorted[i];
    const { template } = busy;
    const isFirst = template.id === firstBusy.id;

    // Process willConsume first
    for (const [varName, requiredQty] of Object.entries(template.willConsume)) {
      const availableQty = available.get(varName) ?? 0;

      if (availableQty >= requiredQty) {
        // Fully satisfied internally
        available.set(varName, availableQty - requiredQty);
      } else {
        // Partially or fully unsatisfied
        const deficit = requiredQty - availableQty;

        if (isFirst) {
          // First busy: deficit becomes contract input
          contractInputs[varName] = (contractInputs[varName] ?? 0) + deficit;
          available.set(varName, 0);
        } else {
          // Non-first busy: this is an error
          errors.push({
            type: 'unsatisfied-consume',
            message: `"${template.intent}" requires ${requiredQty} of "${varName}" but only ${availableQty} available. Only the first busy template can have unsatisfied inputs.`,
            templateId: template.id,
            templateIntent: template.intent,
            variableName: varName,
            requiredQuantity: requiredQty,
            availableQuantity: availableQty,
            absoluteOffset: busy.absoluteStart,
          });
          available.set(varName, 0);
        }
      }
    }

    // Process willProduce
    for (const [varName, producedQty] of Object.entries(template.willProduce)) {
      const current = available.get(varName) ?? 0;
      available.set(varName, current + producedQty);
    }
  }

  // Check for invalid unconsumed productions and calculate contract outputs
  const contractOutputs: Record<string, Quantity> = {};

  for (const [varName, leftover] of available) {
    if (leftover <= 0) continue;

    // How much did the last busy produce of this variable?
    const lastProduced = lastBusy.willProduce[varName] ?? 0;

    if (lastProduced >= leftover) {
      // All leftover came from last busy - valid contract output
      contractOutputs[varName] = leftover;
    } else {
      // Some leftover came from earlier busies - this is an error
      if (lastProduced > 0) {
        contractOutputs[varName] = lastProduced;
      }

      // Find non-last busies that produced this variable and report errors
      const nonLastProducers = sorted
        .filter(b => b.template.id !== lastBusy.id)
        .filter(b => (b.template.willProduce[varName] ?? 0) > 0);

      let excessToAttribute = leftover - lastProduced;

      for (const producer of nonLastProducers) {
        const produced = producer.template.willProduce[varName] ?? 0;
        const attributed = Math.min(produced, excessToAttribute);

        if (attributed > 0) {
          errors.push({
            type: 'unsatisfied-produce',
            message: `"${producer.template.intent}" produced ${produced} of "${varName}" but it was never fully consumed. Only the last busy template can have unconsumed outputs.`,
            templateId: producer.template.id,
            templateIntent: producer.template.intent,
            variableName: varName,
            producedQuantity: produced,
            consumedQuantity: produced - attributed,
          });
          excessToAttribute -= attributed;
        }

        if (excessToAttribute <= 0) break;
      }
    }
  }

  // Extract pass-throughs: variables that appear in both contractInputs and contractOutputs
  const passThroughs: Record<string, Quantity> = {};

  for (const varName of Object.keys(contractInputs)) {
    if (varName in contractOutputs) {
      const passThrough = Math.min(contractInputs[varName], contractOutputs[varName]);
      if (passThrough > 0) {
        passThroughs[varName] = passThrough;
        contractInputs[varName] -= passThrough;
        contractOutputs[varName] -= passThrough;

        // Clean up zeros
        if (contractInputs[varName] === 0) delete contractInputs[varName];
        if (contractOutputs[varName] === 0) delete contractOutputs[varName];
      }
    }
  }

  return { contractInputs, contractOutputs, passThroughs };
}

/**
 * Validates a lane template against state transition contract rules.
 * 
 * Checks:
 * 1. Child template duration < parent duration (strict hierarchy, prevents infinite loops)
 * 2. No negative offsets (child cannot start before parent)
 * 3. Child end time (offset + duration) <= parent duration
 * 4. No busy template overlaps in time
 * 5. All referenced templates exist
 * 
 * Contract calculation (temporal simulation):
 * - State must be produced before it can be consumed
 * - contractInputs: what is consumed before being produced (lane requires from outside)
 * - contractOutputs: what is produced but never consumed (lane provides to outside)
 * 
 * @param lane - The lane template to validate
 * @param allTemplates - Template map (for O(1) segment resolution)
 * @returns Validation result with errors and contract signature
 */
export function validateLane(
  lane: LaneTemplate,
  allTemplates: TemplateMap,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check double-linking for this lane's own references (as a child)
  for (const ref of lane.references) {
    const parent = allTemplates[ref.parentId];
    if (!parent) {
      errors.push({
        type: 'missing-template',
        message: `Parent template "${ref.parentId}" referenced by "${lane.intent}" not found`,
        missingTemplateId: ref.parentId,
        referencedBy: lane.id,
      });
      continue;
    }
    if (parent.templateType === 'lane') {
      const hasForwardLink = parent.segments.some(
        s => s.templateId === lane.id && s.relationshipId === ref.relationshipId
      );
      if (!hasForwardLink) {
        errors.push({
          type: 'double-linking-inconsistent',
          message: `Parent "${parent.intent}" (${parent.id}) is missing forward-link to child "${lane.intent}" (${lane.id}) for relationship "${ref.relationshipId}"`,
          parentId: parent.id,
          childId: lane.id,
          relationshipId: ref.relationshipId,
          missingSide: 'parent',
        });
      }
    }
  }

  // Flatten the lane to get all busy templates with absolute timing
  const busies = flattenLane(lane, allTemplates, 0, errors, new Set());

  if (busies.length === 0) {
    return {
      isValid: errors.length === 0,
      errors,
      firstBusy: null,
      lastBusy: null,
      contractInputs: {},
      contractOutputs: {},
      passThroughs: {},
    };
  }

  // Sort by start time to find first and last
  const sorted = [...busies].sort((a, b) => a.absoluteStart - b.absoluteStart);
  const firstBusy = sorted[0].template;
  const lastBusy = sorted[sorted.length - 1].template;

  // Check for overlaps
  checkOverlaps(busies, errors);

  // Validate state transitions
  const { contractInputs, contractOutputs, passThroughs } = validateStateTransitions(busies, errors);

  return {
    isValid: errors.length === 0,
    errors,
    firstBusy,
    lastBusy,
    contractInputs,
    contractOutputs,
    passThroughs,
  };
}
