import type { BusyTemplate, LaneTemplate, Template } from '@tannerbroberts/about-time-core';

interface AggregatedVariables {
  willProduce: Record<string, number>;
  willConsume: Record<string, number>;
}

/**
 * Recursively calculates aggregated willProduce/willConsume variables from all nested segments.
 *
 * Base case: BusyTemplate returns its own variables
 * Recursive case: LaneTemplate sums all segment variables
 *
 * @param templateId - The template to aggregate from
 * @param templates - The full TemplateMap
 * @param visited - Set of visited template IDs for circular dependency protection
 * @returns Aggregated variables object
 */
export function calculateNestedVariables(
  templateId: string,
  templates: Record<string, Template>,
  visited: Set<string> = new Set(),
): AggregatedVariables {
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
    return {
      willProduce: { ...(busyTemplate.willProduce || {}) },
      willConsume: { ...(busyTemplate.willConsume || {}) },
    };
  }

  // Recursive case: LaneTemplate aggregates all segment variables
  if (template.templateType === 'lane') {
    const laneTemplate = template as LaneTemplate;
    const aggregated: AggregatedVariables = {
      willProduce: {},
      willConsume: {},
    };

    // Traverse all segments and sum their variables
    if (laneTemplate.segments) {
      for (const segment of laneTemplate.segments) {
        const segmentVars = calculateNestedVariables(segment.templateId, templates, visited);

        // Sum willProduce variables
        for (const [key, value] of Object.entries(segmentVars.willProduce)) {
          aggregated.willProduce[key] = (aggregated.willProduce[key] || 0) + value;
        }

        // Sum willConsume variables
        for (const [key, value] of Object.entries(segmentVars.willConsume)) {
          aggregated.willConsume[key] = (aggregated.willConsume[key] || 0) + value;
        }
      }
    }

    return aggregated;
  }

  // Unknown template type
  return { willProduce: {}, willConsume: {} };
}
