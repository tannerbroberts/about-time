import type { Template, TemplateType, TemplateMap } from '../types/index.js';

export interface GetTemplatesOptions {
  templateType?: TemplateType;
}

/**
 * Gets templates as an array, optionally filtered by type.
 * Use sparingly on large maps—iteration is O(n).
 * 
 * @param templates - Template map
 * @param options - Filter options
 * @returns Array of templates
 */
export function getTemplates(
  templates: TemplateMap,
  options: GetTemplatesOptions = {},
): Template[] {
  const values = Object.values(templates);
  
  if (options.templateType) {
    return values.filter(t => t.templateType === options.templateType);
  }
  return values;
}
