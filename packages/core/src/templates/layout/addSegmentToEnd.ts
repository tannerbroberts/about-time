import type { TemplateId, TemplateMap, LaneTemplate, RelationshipId } from '../../types/index.js';
import { isLaneTemplate } from '../../types/template.js';

/**
 * Adds a new segment at the very end of the lane.
 * 
 * @param laneId - ID of the lane
 * @param childId - ID of the template to add as a segment
 * @param relationshipId - Unique ID for this specific relationship
 * @param templates - Template map (mutated in place)
 * @returns The updated LaneTemplate or null
 */
export function addSegmentToEnd(
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

  // Calculate current end time
  let maxEndTime = 0;
  for (const segment of lane.segments) {
    const segmentChild = templates[segment.templateId];
    if (segmentChild) {
      if (segmentChild.estimatedDuration <= 0) {
        throw new Error(`Template "${segmentChild.intent}" (${segmentChild.id}) has zero or negative duration`);
      }
      const endTime = segment.offset + segmentChild.estimatedDuration;
      if (endTime > maxEndTime) {
        maxEndTime = endTime;
      }
    }
  }

  const newSegment = {
    templateId: childId,
    relationshipId,
    offset: maxEndTime,
  };

  lane.segments.push(newSegment);

  // Double-linking
  child.references.push({
    parentId: laneId,
    relationshipId,
  });

  return lane;
}
