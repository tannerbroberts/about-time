import type { TemplateId, TemplateMap, LaneTemplate, Duration } from '../../types/index.js';
import { isLaneTemplate } from '../../types/template.js';

export interface LaneLayoutOptions {
  justifyContent?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: Duration;
}

/**
 * Applies flexbox-like layout rules to a lane's segments.
 * Sorts segments by their current offset before applying layout.
 * 
 * @param laneId - ID of the lane to layout
 * @param templates - Template map (mutated in place)
 * @param options - Layout options (justifyContent, gap)
 * @returns The updated LaneTemplate or null
 */
export function applyLaneLayout(
  laneId: TemplateId,
  templates: TemplateMap,
  options: LaneLayoutOptions = {},
): LaneTemplate | null {
  const lane = templates[laneId];
  if (!lane || !isLaneTemplate(lane)) {
    return null;
  }

  if (lane.segments.length === 0) {
    return lane;
  }

  const { justifyContent = 'start', gap = 0 } = options;

  // Sort segments by current offset to maintain relative order
  const sortedSegments = [...lane.segments].sort((a, b) => a.offset - b.offset);
  
  // Calculate total duration of children (throw if zero-duration found)
  const childDurations = sortedSegments.map(s => {
    const child = templates[s.templateId];
    if (child && child.estimatedDuration <= 0) {
      throw new Error(`Template "${child.intent}" (${child.id}) has zero or negative duration`);
    }
    return child ? child.estimatedDuration : 0;
  });
  
  const totalChildDuration = childDurations.reduce((sum, d) => sum + d, 0);
  const numSegments = sortedSegments.length;
  const totalGapDuration = gap * (numSegments - 1);
  const contentDuration = totalChildDuration + totalGapDuration;
  const remainingSpace = lane.estimatedDuration - contentDuration;

  let currentOffset = 0;
  let extraGap = 0;

  switch (justifyContent) {
    case 'start':
      currentOffset = 0;
      break;
    case 'end':
      currentOffset = remainingSpace;
      break;
    case 'center':
      currentOffset = remainingSpace / 2;
      break;
    case 'space-between':
      currentOffset = 0;
      if (numSegments > 1) {
        extraGap = remainingSpace / (numSegments - 1);
      }
      break;
    case 'space-around':
      if (numSegments > 0) {
        extraGap = remainingSpace / numSegments;
        currentOffset = extraGap / 2;
      }
      break;
    case 'space-evenly':
      if (numSegments > 0) {
        extraGap = remainingSpace / (numSegments + 1);
        currentOffset = extraGap;
      }
      break;
  }

  for (let i = 0; i < numSegments; i++) {
    sortedSegments[i].offset = currentOffset;
    currentOffset += childDurations[i] + gap + extraGap;
  }

  // Update the lane's segments array with the sorted and repositioned segments
  lane.segments = sortedSegments;

  return lane;
}
