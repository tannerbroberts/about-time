import type { TemplateId, TemplateMap, LaneTemplate, RelationshipId, Duration } from '../../types/index.js';
import { isLaneTemplate } from '../../types/template.js';

/**
 * Inserts a segment at a specific offset and shifts all segments that start
 * at or after that offset forward by the new child's duration.
 * 
 * @param laneId - ID of the lane
 * @param childId - ID of the template to add
 * @param offset - The offset at which to insert
 * @param relationshipId - Unique ID for this relationship
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function insertSegmentAt(
  laneId: TemplateId,
  childId: TemplateId,
  offset: Duration,
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

  // Shift segments that start at or after the insertion offset
  for (const segment of lane.segments) {
    if (segment.offset >= offset) {
      segment.offset += shiftAmount;
    }
  }

  // Add new segment
  lane.segments.push({
    templateId: childId,
    relationshipId,
    offset,
  });

  // Double-linking
  child.references.push({
    parentId: laneId,
    relationshipId,
  });

  return lane;
}
