import type { Template, TemplateId, TemplateMap } from '../types/index.js';

export type DeleteTemplateResult = 
  | { success: true; deleted: Template }
  | { success: false; error: string };

/**
 * Deletes a template by ID in place.
 * Mutates the map for O(1) performance.
 * 
 * @param id - ID of template to delete
 * @param templates - Template map (mutated in place)
 * @returns Result with the deleted template or error
 */
export function deleteTemplate(
  id: TemplateId,
  templates: TemplateMap,
): DeleteTemplateResult {
  const existing = templates[id];

  if (!existing) {
    return {
      success: false,
      error: `Template with ID ${id} not found`,
    };
  }

  // 1. If it's a lane template, remove back-links from its children
  if (existing.templateType === 'lane') {
    for (const segment of existing.segments) {
      const child = templates[segment.templateId];
      if (child) {
        child.references = child.references.filter(
          ref => !(ref.parentId === id && ref.relationshipId === segment.relationshipId)
        );
      }
    }
  }

  // 2. Remove this template from its parents' segments
  for (const ref of existing.references) {
    const parent = templates[ref.parentId];
    if (parent?.templateType === 'lane') {
      parent.segments = parent.segments.filter(
        s => !(s.templateId === id && s.relationshipId === ref.relationshipId)
      );
    }
  }

  delete templates[id];

  return {
    success: true,
    deleted: existing,
  };
}
