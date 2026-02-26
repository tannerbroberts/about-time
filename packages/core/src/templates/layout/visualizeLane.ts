import type { TemplateId, TemplateMap, LaneTemplate } from '../../types/index.js';
import { isLaneTemplate, isBusyTemplate } from '../../types/template.js';

const MS_PER_CHAR = 1000;

/**
 * Generates a text-based visualization of a lane and its segments.
 * 
 * **⚠️ DEBUG UTILITY ONLY** - This function is intended for development and
 * debugging purposes. Production applications should use a proper frontend
 * UI for visualization, not ASCII art.
 * 
 * - 1 character = 1 second
 * - `█` = busy template
 * - `_` = lane template
 * - `░` = empty space within a lane's span (gap)
 * - ` ` = outside any lane's span at that level
 * 
 * Segments render in layers above their parent lane, with the deepest
 * children at the top and the root lane floor at the bottom.
 * 
 * @param laneId - ID of the lane to visualize
 * @param templates - Template map containing all referenced templates
 * @returns Multi-line string visualization
 * @throws Error if durations/offsets aren't whole seconds, overlaps exist, or templates are missing
 * 
 * @example
 * ```
 *    █░██         ← grandchild busy templates
 *  ░______░░░░    ← child lane segment  
 * ____________    ← root lane
 * ```
 */
export function visualizeLane(
  laneId: TemplateId,
  templates: TemplateMap,
): string {
  const lane = templates[laneId];
  if (!lane) {
    throw new Error(`Template "${laneId}" not found in templates map`);
  }
  if (!isLaneTemplate(lane)) {
    throw new Error(`Template "${laneId}" is not a lane template`);
  }

  // Validate whole seconds
  validateWholeSeconds(lane, templates);

  // Validate no overlaps
  validateNoOverlaps(lane, templates);

  const width = lane.estimatedDuration / MS_PER_CHAR;
  if (width > 20) {
    throw new Error(`Lane duration exceeds 20 seconds (${width}s). Max supported is 20 seconds.`);
  }

  const layers: string[] = [];

  // Add root lane floor (all underscores)
  layers.push('_'.repeat(width));

  // If root has segments, add children layers recursively
  if (lane.segments.length > 0) {
    addChildrenLayers(lane, templates, layers, 0, width);
  }

  // Reverse so deepest children are on top, root floor at bottom
  return layers.reverse().join('\n');
}

/**
 * Recursively adds visualization layers for a lane's children.
 * Each layer is added to the array, then we recurse into lane children.
 */
function addChildrenLayers(
  lane: LaneTemplate,
  templates: TemplateMap,
  layers: string[],
  globalOffset: number,
  totalWidth: number,
): void {
  const laneWidth = lane.estimatedDuration / MS_PER_CHAR;

  // Build this lane's children layer
  const layer = Array<string>(totalWidth).fill(' ');

  // Fill lane's span with ░ (represents empty space, will be overwritten by segments)
  for (let i = globalOffset; i < globalOffset + laneWidth; i++) {
    layer[i] = '░';
  }

  // Overlay segments
  for (const segment of lane.segments) {
    const child = templates[segment.templateId];
    // Already validated in validateWholeSeconds
    const segStart = globalOffset + segment.offset / MS_PER_CHAR;
    const segDuration = child.estimatedDuration / MS_PER_CHAR;
    const char = isBusyTemplate(child) ? '█' : '_';

    for (let i = 0; i < segDuration; i++) {
      layer[segStart + i] = char;
    }
  }

  layers.push(layer.join(''));

  // Recursively add children layers for lane children that have segments
  for (const segment of lane.segments) {
    const child = templates[segment.templateId];
    if (isLaneTemplate(child) && child.segments.length > 0) {
      const childGlobalOffset = globalOffset + segment.offset / MS_PER_CHAR;
      addChildrenLayers(child, templates, layers, childGlobalOffset, totalWidth);
    }
  }
}

/**
 * Validates that all durations and offsets are whole seconds (divisible by 1000ms).
 * Recursively validates all referenced templates.
 */
function validateWholeSeconds(
  lane: LaneTemplate,
  templates: TemplateMap,
  visited: Set<TemplateId> = new Set(),
): void {
  if (visited.has(lane.id)) {
    return; // Avoid infinite loops on circular references
  }
  visited.add(lane.id);

  if (lane.estimatedDuration % MS_PER_CHAR !== 0) {
    throw new Error(
      `Lane "${lane.id}" has non-whole-second duration: ${lane.estimatedDuration}ms. ` +
      `Duration must be divisible by ${MS_PER_CHAR}ms.`
    );
  }

  for (const segment of lane.segments) {
    if (segment.offset % MS_PER_CHAR !== 0) {
      throw new Error(
        `Segment in lane "${lane.id}" has non-whole-second offset: ${segment.offset}ms. ` +
        `Offset must be divisible by ${MS_PER_CHAR}ms.`
      );
    }

    const child = templates[segment.templateId];
    if (!child) {
      throw new Error(
        `Segment references template "${segment.templateId}" which was not found in templates map`
      );
    }

    if (child.estimatedDuration <= 0) {
      throw new Error(
        `Template "${child.id}" has zero or negative duration`
      );
    }

    if (child.estimatedDuration % MS_PER_CHAR !== 0) {
      throw new Error(
        `Template "${child.id}" has non-whole-second duration: ${child.estimatedDuration}ms. ` +
        `Duration must be divisible by ${MS_PER_CHAR}ms.`
      );
    }

    // Recursively validate lane children
    if (isLaneTemplate(child)) {
      validateWholeSeconds(child, templates, visited);
    }
  }
}

/**
 * Validates that no segments overlap within a lane.
 * Recursively validates all lane children.
 */
function validateNoOverlaps(
  lane: LaneTemplate,
  templates: TemplateMap,
  visited: Set<TemplateId> = new Set(),
): void {
  if (visited.has(lane.id)) {
    return;
  }
  visited.add(lane.id);

  // Build a list of segment spans
  const spans: Array<{ start: number; end: number; templateId: TemplateId }> = [];

  for (const segment of lane.segments) {
    const child = templates[segment.templateId];
    // Child existence already validated
    const start = segment.offset;
    const end = segment.offset + child.estimatedDuration;
    spans.push({ start, end, templateId: segment.templateId });
  }

  // Sort by start time
  spans.sort((a, b) => a.start - b.start);

  // Check for overlaps
  for (let i = 0; i < spans.length - 1; i++) {
    const current = spans[i];
    const next = spans[i + 1];
    if (current.end > next.start) {
      throw new Error(
        `Overlap detected in lane "${lane.id}": ` +
        `segment "${current.templateId}" (ends at ${current.end}ms) ` +
        `overlaps with segment "${next.templateId}" (starts at ${next.start}ms)`
      );
    }
  }

  // Recursively validate lane children
  for (const segment of lane.segments) {
    const child = templates[segment.templateId];
    if (isLaneTemplate(child)) {
      validateNoOverlaps(child, templates, visited);
    }
  }
}
