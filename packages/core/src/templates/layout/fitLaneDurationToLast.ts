import type { TemplateId, TemplateMap, LaneTemplate } from '../../types/index.js';
import { isLaneTemplate } from '../../types/template.js';

/**
 * Updates a lane's estimatedDuration to match the end-time of its last segment.
 * End-time is calculated as (segment.offset + child.estimatedDuration).
 * 
 * @param laneId - ID of the lane to resize
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null if not found/not a lane
 */
export function fitLaneDurationToLast(
  laneId: TemplateId,
  templates: TemplateMap,
): LaneTemplate | null {
  const lane = templates[laneId];
  if (!lane || !isLaneTemplate(lane)) {
    return null;
  }

  if (lane.segments.length === 0) {
    lane.estimatedDuration = 0;
    return lane;
  }

  let maxEndTime = 0;
  for (const segment of lane.segments) {
    const child = templates[segment.templateId];
    if (child) {
      if (child.estimatedDuration <= 0) {
        throw new Error(`Template "${child.intent}" (${child.id}) has zero or negative duration`);
      }
      const endTime = segment.offset + child.estimatedDuration;
      if (endTime > maxEndTime) {
        maxEndTime = endTime;
      }
    }
  }

  lane.estimatedDuration = maxEndTime;
  return lane;
}
