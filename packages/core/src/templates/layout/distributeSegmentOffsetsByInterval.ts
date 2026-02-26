import type { TemplateId, TemplateMap, LaneTemplate, Duration } from '../../types/index.js';
import { applyLaneLayout } from './applyLaneLayout.js';

/**
 * Distributes segments with a fixed interval (gap) between them,
 * starting from offset 0.
 * 
 * @param laneId - ID of the lane
 * @param interval - The gap duration between segments
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function distributeSegmentOffsetsByInterval(
  laneId: TemplateId,
  interval: Duration,
  templates: TemplateMap,
): LaneTemplate | null {
  return applyLaneLayout(laneId, templates, {
    justifyContent: 'start',
    gap: interval,
  });
}
