import type { TemplateId, TemplateMap, LaneTemplate, RelationshipId } from '../../types/index.js';
import { isLaneTemplate } from '../../types/template.js';

/**
 * Adds a new segment at offset 0 and shifts all existing segments forward
 * by the new child's duration.
 * 
 * @param laneId - ID of the lane
 * @param childId - ID of the template to add
 * @param relationshipId - Unique ID for this relationship
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function pushSegmentToStart(
  laneId: TemplateId,
  childId: TemplateId,
  relationshipId: RelationshipId,
  templates: TemplateMap,
): LaneTemplate | null {
  const lane = templates[laneId];
  const child = templates[childId];
  
  if (!lane || !isLaneTemplate(lane) || !child) {
    return null;
  }

  if (child.estimatedDuration <= 0) {
    throw new Error(`Template "${child.intent}" (${child.id}) has zero or negative duration`);
  }

  const shiftAmount = child.estimatedDuration;

  // Shift existing segments
  for (const segment of lane.segments) {
    segment.offset += shiftAmount;
  }

  // Add new segment at start
  lane.segments.unshift({
    templateId: childId,
    relationshipId,
    offset: 0,
  });

  // Double-linking
  child.references.push({
    parentId: laneId,
    relationshipId,
  });

  return lane;
}
