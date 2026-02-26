import type { TemplateId, TemplateMap, LaneTemplate } from '../../types/index.js';
import { applyLaneLayout } from './applyLaneLayout.js';

/**
 * Re-organizes the offsets of each segment so they fit perfectly with no gaps,
 * starting from offset 0. Does NOT resize the lane duration.
 * 
 * @param laneId - ID of the lane to pack
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function packSegments(
  laneId: TemplateId,
  templates: TemplateMap,
): LaneTemplate | null {
  return applyLaneLayout(laneId, templates, {
    justifyContent: 'start',
    gap: 0,
  });
}
