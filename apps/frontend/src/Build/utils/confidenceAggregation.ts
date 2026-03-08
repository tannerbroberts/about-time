import type { ValueWithConfidence } from '@about-time/types';
import { addWithConfidence, normalizeValue } from '@about-time/types';
import type { BusyTemplate, LaneTemplate, Template } from '@tannerbroberts/about-time-core';

interface AggregatedVariablesWithConfidence {
  willProduce: Record<string, ValueWithConfidence>;
  willConsume: Record<string, ValueWithConfidence>;
}

/**
 * Recursively calculates aggregated willProduce/willConsume variables with confidence bounds.
 * This is the confidence-aware version of calculateNestedVariables.
 *
 * Base case: BusyTemplate returns its own variables (as ValueWithConfidence)
 * Recursive case: LaneTemplate sums all segment variables with confidence propagation
 *
 * @param templateId - The template to aggregate from
 * @param templates - The full TemplateMap
 * @param variablesWithConfidence - Optional map of template variables with confidence bounds from database
 * @param visited - Set of visited template IDs for circular dependency protection
 * @returns Aggregated variables with confidence bounds
 */
export function calculateNestedVariablesWithConfidence(
  templateId: string,
  templates: Record<string, Template>,
  variablesWithConfidence?: Map<string, Map<string, ValueWithConfidence>>, // templateId -> variableName -> value
  visited: Set<string> = new Set(),
): AggregatedVariablesWithConfidence {
  // Circular dependency protection
  if (visited.has(templateId)) {
    return { willProduce: {}, willConsume: {} };
  }

  const template = templates[templateId];
  if (!template) {
    return { willProduce: {}, willConsume: {} };
  }

  visited.add(templateId);

  // Base case: BusyTemplate returns its own variables
  if (template.templateType === 'busy') {
    const busyTemplate = template as BusyTemplate;
    const result: AggregatedVariablesWithConfidence = {
      willProduce: {},
      willConsume: {},
    };

    // Get confidence bounds from database if available
    const templateVars = variablesWithConfidence?.get(templateId);

    // Process willProduce
    if (busyTemplate.willProduce) {
      for (const [varName, nominalValue] of Object.entries(busyTemplate.willProduce)) {
        // Check if we have confidence bounds from database
        const withConfidence = templateVars?.get(`produce:${varName}`);
        result.willProduce[varName] = withConfidence || normalizeValue(nominalValue);
      }
    }

    // Process willConsume
    if (busyTemplate.willConsume) {
      for (const [varName, nominalValue] of Object.entries(busyTemplate.willConsume)) {
        // Check if we have confidence bounds from database
        const withConfidence = templateVars?.get(`consume:${varName}`);
        result.willConsume[varName] = withConfidence || normalizeValue(nominalValue);
      }
    }

    return result;
  }

  // Recursive case: LaneTemplate aggregates all segment variables
  if (template.templateType === 'lane') {
    const laneTemplate = template as LaneTemplate;
    const aggregated: AggregatedVariablesWithConfidence = {
      willProduce: {},
      willConsume: {},
    };

    // Traverse all segments and sum their variables with confidence propagation
    if (laneTemplate.segments) {
      for (const segment of laneTemplate.segments) {
        // Create a new visited set for each segment
        const segmentVisited = new Set(visited);
        const segmentVars = calculateNestedVariablesWithConfidence(
          segment.templateId,
          templates,
          variablesWithConfidence,
          segmentVisited,
        );

        // Sum willProduce variables with confidence propagation
        for (const [key, value] of Object.entries(segmentVars.willProduce)) {
          if (aggregated.willProduce[key]) {
            aggregated.willProduce[key] = addWithConfidence(aggregated.willProduce[key], value);
          } else {
            aggregated.willProduce[key] = value;
          }
        }

        // Sum willConsume variables with confidence propagation
        for (const [key, value] of Object.entries(segmentVars.willConsume)) {
          if (aggregated.willConsume[key]) {
            aggregated.willConsume[key] = addWithConfidence(aggregated.willConsume[key], value);
          } else {
            aggregated.willConsume[key] = value;
          }
        }
      }
    }

    return aggregated;
  }

  // Unknown template type
  return { willProduce: {}, willConsume: {} };
}

/**
 * Helper function to convert database template_variables records into the Map structure
 * expected by calculateNestedVariablesWithConfidence.
 *
 * @param dbRecords - Array of template_variables records from database
 * @returns Map structure: templateId -> variableName -> ValueWithConfidence
 */
export function buildConfidenceMap(
  dbRecords: Array<{
    templateId: string;
    variableName: string;
    variableType: 'produce' | 'consume';
    nominalValue: number;
    lowerBound?: number;
    upperBound?: number;
  }>,
): Map<string, Map<string, ValueWithConfidence>> {
  const result = new Map<string, Map<string, ValueWithConfidence>>();

  for (const record of dbRecords) {
    if (!result.has(record.templateId)) {
      result.set(record.templateId, new Map());
    }

    const templateMap = result.get(record.templateId)!;
    const key = `${record.variableType}:${record.variableName}`;

    const value: ValueWithConfidence = {
      value: record.nominalValue,
      lower: record.lowerBound,
      upper: record.upperBound,
    };

    templateMap.set(key, value);
  }

  return result;
}
