import type { TemplateId, TemplateMap, LaneTemplate } from '../../types/index.js';
import { applyLaneLayout } from './applyLaneLayout.js';

/**
 * Equally distributes segments across the lane's current estimatedDuration.
 * Uses 'space-between' logic (first segment at 0, last segment ends at duration).
 * 
 * @param laneId - ID of the lane
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function equallyDistributeSegments(
  laneId: TemplateId,
  templates: TemplateMap,
): LaneTemplate | null {
  return applyLaneLayout(laneId, templates, {
    justifyContent: 'space-between',
    gap: 0,
  });
}
