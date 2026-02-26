import type { Template, TemplateId, TemplateMap } from '../types/index.js';

/**
 * Finds a template by ID.
 * O(1) lookup performance.
 * 
 * @param id - The template ID to find
 * @param templates - Template map to search
 * @returns The template if found, undefined otherwise
 */
export function getTemplateById(
  id: TemplateId,
  templates: TemplateMap,
): Template | undefined {
  return templates[id];
}
