import type { TemplateId, TemplateMap, LaneTemplate, Duration } from '../../types/index.js';
import { isLaneTemplate } from '../../types/template.js';

/**
 * Inserts empty space before a specific segment by shifting it and all subsequent segments.
 * 
 * @param laneId - ID of the lane
 * @param beforeSegmentIndex - Index of the segment before which to insert the gap
 * @param gapDuration - Duration of the gap to insert
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function insertGap(
  laneId: TemplateId,
  beforeSegmentIndex: number,
  gapDuration: Duration,
  templates: TemplateMap,
): LaneTemplate | null {
  const lane = templates[laneId];
  if (!lane || !isLaneTemplate(lane)) {
    return null;
  }

  if (beforeSegmentIndex < 0 || beforeSegmentIndex >= lane.segments.length) {
    return null;
  }

  const targetSegment = lane.segments[beforeSegmentIndex];
  const shiftThreshold = targetSegment.offset;

  for (const segment of lane.segments) {
    if (segment.offset >= shiftThreshold) {
      segment.offset += gapDuration;
    }
  }

  return lane;
}
