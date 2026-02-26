/**
 * Calculate the left position percentage of a segment within its base template
 * @param offset - Offset in milliseconds from start of base template
 * @param baseDuration - Total duration of base template in milliseconds
 * @returns Percentage value (0-100) for CSS left positioning
 */
export function calculateSegmentPosition(offset: number, baseDuration: number): number {
  if (baseDuration === 0) {
    return 0;
  }
  return (offset / baseDuration) * 100;
}

/**
 * Calculate the width percentage of a segment within its base template
 * @param duration - Duration of segment in milliseconds
 * @param baseDuration - Total duration of base template in milliseconds
 * @returns Percentage value (0-100) for CSS width
 */
export function calculateSegmentWidth(duration: number, baseDuration: number): number {
  if (baseDuration === 0) {
    return 0;
  }
  return (duration / baseDuration) * 100;
}

/**
 * Recursively count the number of nested levels in a template
 * @param templateId - ID of template to analyze
 * @param templates - Map of all templates
 * @param visited - Set of visited template IDs to prevent infinite loops
 * @returns Maximum depth of nested segments
 */
export function countNestedLevels(
  templateId: string,
  templates: Record<string, { templateType: string; segments?: Array<{ templateId: string }> }>,
  visited: Set<string> = new Set(),
): number {
  // Prevent infinite recursion from circular dependencies
  if (visited.has(templateId)) {
    return 0;
  }

  const template = templates[templateId];
  if (!template || template.templateType !== 'lane' || !template.segments || template.segments.length === 0) {
    return 0;
  }

  visited.add(templateId);

  let maxDepth = 0;
  for (const segment of template.segments) {
    const depth = countNestedLevels(segment.templateId, templates, visited);
    maxDepth = Math.max(maxDepth, depth);
  }

  return maxDepth + 1;
}

/**
 * Format duration in milliseconds to human-readable time string
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2min", "1h 30min", "45sec")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}min`;
  }

  return `${seconds}sec`;
}
