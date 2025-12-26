/**
 * Lane validation utilities
 *
 * Validates that lanes follow the state transition contract rules:
 * 1. Only the first busy template can have unsatisfied willConsume variables
 * 2. Only the last busy template can have unsatisfied willProduce variables
 * 3. Busy templates must not overlap in time (flattened to absolute timeline)
 * 4. All internal state must be produced before consumed
 */

// Re-declare types here to avoid import path issues between app and MCP server
type TemplateId = string;
type Duration = number;
type StateLedger = Record<string, number>;

interface Segment {
  templateId: TemplateId;
  offset: Duration;
}

interface BusyTemplate {
  templateType: 'busy';
  id: TemplateId;
  intent: string;
  estimatedDuration: Duration;
  willConsume: StateLedger;
  willProduce: StateLedger;
}

interface LaneTemplate {
  templateType: 'lane';
  id: TemplateId;
  intent: string;
  estimatedDuration: Duration;
  segments: Segment[];
}

type Template = BusyTemplate | LaneTemplate;

// ============================================================================
// Validation Error Types
// ============================================================================

interface BusyOverlapError {
  type: 'busy-overlap';
  message: string;
  template1Id: TemplateId;
  template1Intent: string;
  template2Id: TemplateId;
  template2Intent: string;
  overlapStart: number;
  overlapEnd: number;
}

interface UnsatisfiedConsumeError {
  type: 'unsatisfied-consume';
  message: string;
  templateId: TemplateId;
  templateIntent: string;
  variableName: string;
  requiredQuantity: number;
  availableQuantity: number;
  absoluteOffset: number;
}

interface UnsatisfiedProduceError {
  type: 'unsatisfied-produce';
  message: string;
  templateId: TemplateId;
  templateIntent: string;
  variableName: string;
  producedQuantity: number;
  consumedQuantity: number;
}

interface MissingTemplateError {
  type: 'missing-template';
  message: string;
  missingTemplateId: TemplateId;
  referencedBy: TemplateId;
}

interface EmptyLaneError {
  type: 'empty-lane';
  message: string;
  laneId: TemplateId;
  laneIntent: string;
}

type ValidationErrorType = BusyOverlapError
  | UnsatisfiedConsumeError
  | UnsatisfiedProduceError
  | MissingTemplateError
  | EmptyLaneError;

interface ValidationResultType {
  isValid: boolean;
  errors: ValidationErrorType[];
  firstBusy: BusyTemplate | null;
  lastBusy: BusyTemplate | null;
  contractInputs: StateLedger;
  contractOutputs: StateLedger;
}

// ============================================================================
// Flattened Busy Template (for timeline analysis)
// ============================================================================

interface FlattenedBusy {
  template: BusyTemplate;
  absoluteOffset: number;
  absoluteEnd: number;
}

// ============================================================================
// Core Resolution Functions
// ============================================================================

/**
 * Recursively resolve the first busy template in a template hierarchy.
 * For lanes, this is the busy template at the earliest absolute offset.
 */
function resolveFirstBusy(
  template: Template,
  allTemplates: Template[],
  parentOffset: number = 0,
): { busy: BusyTemplate; absoluteOffset: number } | null {
  if (template.templateType === 'busy') {
    return { busy: template, absoluteOffset: parentOffset };
  }

  const lane = template;
  if (lane.segments.length === 0) {
    return null;
  }

  // Find the segment with the smallest absolute offset
  let earliest: { busy: BusyTemplate; absoluteOffset: number } | null = null;

  for (const segment of lane.segments) {
    const segmentTemplate = allTemplates.find((t) => t.id === segment.templateId);
    if (!segmentTemplate) continue;

    const absoluteOffset = parentOffset + segment.offset;
    const result = resolveFirstBusy(segmentTemplate, allTemplates, absoluteOffset);

    if (result && (earliest === null || result.absoluteOffset < earliest.absoluteOffset)) {
      earliest = result;
    }
  }

  return earliest;
}

/**
 * Recursively resolve the last busy template in a template hierarchy.
 * For lanes, this is the busy template that ends at the latest absolute time.
 */
function resolveLastBusy(
  template: Template,
  allTemplates: Template[],
  parentOffset: number = 0,
): { busy: BusyTemplate; absoluteEnd: number } | null {
  if (template.templateType === 'busy') {
    return {
      busy: template,
      absoluteEnd: parentOffset + template.estimatedDuration,
    };
  }

  const lane = template;
  if (lane.segments.length === 0) {
    return null;
  }

  // Find the segment that ends at the latest absolute time
  let latest: { busy: BusyTemplate; absoluteEnd: number } | null = null;

  for (const segment of lane.segments) {
    const segmentTemplate = allTemplates.find((t) => t.id === segment.templateId);
    if (!segmentTemplate) continue;

    const absoluteOffset = parentOffset + segment.offset;
    const result = resolveLastBusy(segmentTemplate, allTemplates, absoluteOffset);

    if (result && (latest === null || result.absoluteEnd > latest.absoluteEnd)) {
      latest = result;
    }
  }

  return latest;
}

/**
 * Flatten a template hierarchy into a list of busy templates with absolute offsets.
 */
function flattenBusyTemplates(
  template: Template,
  allTemplates: Template[],
  parentOffset: number = 0,
  errors: ValidationErrorType[] = [],
): FlattenedBusy[] {
  if (template.templateType === 'busy') {
    return [{
      template,
      absoluteOffset: parentOffset,
      absoluteEnd: parentOffset + template.estimatedDuration,
    }];
  }

  const lane = template;
  const result: FlattenedBusy[] = [];

  for (const segment of lane.segments) {
    const segmentTemplate = allTemplates.find((t) => t.id === segment.templateId);
    if (!segmentTemplate) {
      errors.push({
        type: 'missing-template',
        message: `Template "${segment.templateId}" not found`,
        missingTemplateId: segment.templateId,
        referencedBy: lane.id,
      });
      continue;
    }

    const absoluteOffset = parentOffset + segment.offset;
    result.push(
      ...flattenBusyTemplates(segmentTemplate, allTemplates, absoluteOffset, errors),
    );
  }

  return result;
}

// ============================================================================
// Overlap Detection
// ============================================================================

/**
 * Check for overlapping busy templates in the flattened timeline.
 */
function checkBusyOverlaps(flattened: FlattenedBusy[]): ValidationErrorType[] {
  const errors: ValidationErrorType[] = [];

  // Sort by absolute offset
  const sorted = [...flattened].sort((a, b) => a.absoluteOffset - b.absoluteOffset);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];

    // Check against all subsequent items that might overlap
    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j];

      // If next starts after current ends, no more overlaps possible with current
      if (next.absoluteOffset >= current.absoluteEnd) {
        break;
      }

      // Overlap detected
      errors.push({
        type: 'busy-overlap',
        message: `"${current.template.intent}" overlaps with "${next.template.intent}"`,
        template1Id: current.template.id,
        template1Intent: current.template.intent,
        template2Id: next.template.id,
        template2Intent: next.template.intent,
        overlapStart: next.absoluteOffset,
        overlapEnd: Math.min(current.absoluteEnd, next.absoluteEnd),
      });
    }
  }

  return errors;
}

// ============================================================================
// Ledger Simulation
// ============================================================================

/**
 * Simulate execution of busy templates in chronological order,
 * tracking variable availability and validating consume/produce constraints.
 */
function simulateLedger(
  flattened: FlattenedBusy[],
  firstBusy: BusyTemplate | null,
  lastBusy: BusyTemplate | null,
): {
  errors: ValidationErrorType[];
  contractInputs: StateLedger;
  contractOutputs: StateLedger;
} {
  const errors: ValidationErrorType[] = [];

  // Current state of available variables (name -> quantity)
  const ledger: StateLedger = {};

  // Track what the first busy needs (contract inputs)
  const contractInputs: StateLedger = {};

  // Track what gets produced but never consumed (potential contract outputs)
  const allProduced: StateLedger = {};
  const allConsumed: StateLedger = {};

  // Sort by absolute offset for chronological execution
  const sorted = [...flattened].sort((a, b) => a.absoluteOffset - b.absoluteOffset);

  for (const item of sorted) {
    const { template, absoluteOffset } = item;
    const isFirst = firstBusy && template.id === firstBusy.id;

    // Process consumption
    for (const [varName, quantity] of Object.entries(template.willConsume)) {
      const available = ledger[varName] ?? 0;

      if (available < quantity) {
        const deficit = quantity - available;

        if (isFirst) {
          // First busy is allowed to have unsatisfied inputs - these become contract inputs
          contractInputs[varName] = (contractInputs[varName] ?? 0) + deficit;
        } else {
          // Non-first busy with unsatisfied input is an error
          const errorMsg = `"${template.intent}" needs ${quantity}`
            + ` "${varName}" but only ${available} available`;
          errors.push({
            type: 'unsatisfied-consume',
            message: errorMsg,
            templateId: template.id,
            templateIntent: template.intent,
            variableName: varName,
            requiredQuantity: quantity,
            availableQuantity: available,
            absoluteOffset,
          });
        }
      }

      // Consume from ledger (even if deficit, consume what's available)
      ledger[varName] = Math.max(0, available - quantity);
      allConsumed[varName] = (allConsumed[varName] ?? 0) + quantity;
    }

    // Process production
    for (const [varName, quantity] of Object.entries(template.willProduce)) {
      ledger[varName] = (ledger[varName] ?? 0) + quantity;
      allProduced[varName] = (allProduced[varName] ?? 0) + quantity;
    }
  }

  // After simulation, check for unconsumed outputs
  // Only the last busy is allowed to have unconsumed outputs
  const contractOutputs: StateLedger = {};

  for (const [varName, producedQty] of Object.entries(allProduced)) {
    const consumedQty = allConsumed[varName] ?? 0;
    const remaining = producedQty - consumedQty;

    if (remaining > 0) {
      // Find which template produced this remaining output
      // We need to check if it was the last busy
      const producerItems = sorted.filter(
        (item) => Object.keys(item.template.willProduce).includes(varName),
      );

      // Get the last producer of this variable
      const lastProducer = producerItems[producerItems.length - 1];

      if (lastProducer && lastBusy && lastProducer.template.id === lastBusy.id) {
        // Last busy producing unconsumed output is fine - it's a contract output
        contractOutputs[varName] = remaining;
      } else if (lastProducer) {
        // Non-last busy has unconsumed output
        const errorMsg = `"${lastProducer.template.intent}" produces`
          + ` "${varName}" that is never consumed`;
        errors.push({
          type: 'unsatisfied-produce',
          message: errorMsg,
          templateId: lastProducer.template.id,
          templateIntent: lastProducer.template.intent,
          variableName: varName,
          producedQuantity: remaining,
          consumedQuantity: consumedQty,
        });
      }
    }
  }

  return { errors, contractInputs, contractOutputs };
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a lane template against all state transition contract rules.
 *
 * Rules enforced:
 * 1. Busy templates must not overlap in time
 * 2. Only the first busy template can have unsatisfied willConsume
 * 3. Only the last busy template can have unsatisfied willProduce
 * 4. All referenced templates must exist
 */
export function validateLane(
  lane: LaneTemplate,
  allTemplates: Template[],
): ValidationResultType {
  const errors: ValidationErrorType[] = [];

  // Check for empty lane
  if (lane.segments.length === 0) {
    errors.push({
      type: 'empty-lane',
      message: `Lane "${lane.intent}" has no segments`,
      laneId: lane.id,
      laneIntent: lane.intent,
    });

    return {
      isValid: false,
      errors,
      firstBusy: null,
      lastBusy: null,
      contractInputs: {},
      contractOutputs: {},
    };
  }

  // Resolve first and last busy templates
  const firstResult = resolveFirstBusy(lane, allTemplates, 0);
  const lastResult = resolveLastBusy(lane, allTemplates, 0);

  const firstBusy = firstResult?.busy ?? null;
  const lastBusy = lastResult?.busy ?? null;

  // Flatten all busy templates to absolute timeline
  const flattened = flattenBusyTemplates(lane, allTemplates, 0, errors);

  // Check for overlapping busy templates
  const overlapErrors = checkBusyOverlaps(flattened);
  errors.push(...overlapErrors);

  // Simulate ledger execution
  const ledgerResult = simulateLedger(flattened, firstBusy, lastBusy);
  errors.push(...ledgerResult.errors);

  return {
    isValid: errors.length === 0,
    errors,
    firstBusy,
    lastBusy,
    contractInputs: ledgerResult.contractInputs,
    contractOutputs: ledgerResult.contractOutputs,
  };
}

/**
 * Validate a busy template (trivially valid, just returns its contract).
 */
export function validateBusy(busy: BusyTemplate): ValidationResultType {
  return {
    isValid: true,
    errors: [],
    firstBusy: busy,
    lastBusy: busy,
    contractInputs: { ...busy.willConsume },
    contractOutputs: { ...busy.willProduce },
  };
}

/**
 * Validate any template (dispatches to lane or busy validation).
 */
export function validateTemplate(
  template: Template,
  allTemplates: Template[],
): ValidationResultType {
  if (template.templateType === 'busy') {
    return validateBusy(template);
  }
  return validateLane(template, allTemplates);
}

// ============================================================================
// Type Exports (after function exports to satisfy file naming convention)
// ============================================================================

export type ValidationError = ValidationErrorType;
export type ValidationResult = ValidationResultType;
