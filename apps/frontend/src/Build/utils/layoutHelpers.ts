import type { LaneTemplate, Template } from '@tannerbroberts/about-time-core';

/**
 * Calculates what the new duration would be if "Fit to Content" is applied,
 * WITHOUT mutating the template. Mirrors the logic from fitLaneDurationToLast.
 *
 * @param template - The lane template to calculate for
 * @param templates - The full template map
 * @returns The calculated duration in milliseconds, or null if no segments exist
 */
export function calculateFitToContentDuration(
  template: LaneTemplate,
  templates: Record<string, Template>,
): number | null {
  // If no segments exist, return null
  if (!template.segments || template.segments.length === 0) {
    return null;
  }

  // Calculate the maximum end time across all segments
  let maxEndTime = 0;

  for (const segment of template.segments) {
    const childTemplate = templates[segment.templateId];
    if (childTemplate) {
      const segmentEndTime = segment.offset + childTemplate.estimatedDuration;
      if (segmentEndTime > maxEndTime) {
        maxEndTime = segmentEndTime;
      }
    }
  }

  return maxEndTime;
}
