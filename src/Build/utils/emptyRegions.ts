export interface EmptyRegion {
  start: number;
  end: number;
}

export interface Segment {
  offset: number;
  templateId: string;
}

/**
 * Calculate empty regions (gaps) between segments in a template
 * @param segments - Array of segments with offset and template ID
 * @param templateDuration - Total duration of the parent template in milliseconds
 * @param templates - Map of all templates to get segment durations
 * @returns Array of empty regions with start and end times in milliseconds
 */
export function calculateEmptyRegions(
  segments: Segment[],
  templateDuration: number,
  templates: Record<string, { estimatedDuration: number }>,
): EmptyRegion[] {
  if (segments.length === 0) {
    return [{ start: 0, end: templateDuration }];
  }

  // Create array of occupied regions with start and end times
  const occupiedRegions = segments
    .map((segment) => {
      const template = templates[segment.templateId];
      if (!template) {
        return null;
      }
      return {
        start: segment.offset,
        end: segment.offset + template.estimatedDuration,
      };
    })
    .filter((region): region is { start: number; end: number } => region !== null)
    .sort((a, b) => a.start - b.start);

  const emptyRegions: EmptyRegion[] = [];

  // Check for gap before first segment
  if (occupiedRegions[0].start > 0) {
    emptyRegions.push({ start: 0, end: occupiedRegions[0].start });
  }

  // Check for gaps between segments
  for (let i = 0; i < occupiedRegions.length - 1; i++) {
    const currentEnd = occupiedRegions[i].end;
    const nextStart = occupiedRegions[i + 1].start;

    if (nextStart > currentEnd) {
      emptyRegions.push({ start: currentEnd, end: nextStart });
    }
  }

  // Check for gap after last segment
  const lastEnd = occupiedRegions[occupiedRegions.length - 1].end;
  if (lastEnd < templateDuration) {
    emptyRegions.push({ start: lastEnd, end: templateDuration });
  }

  return emptyRegions;
}
