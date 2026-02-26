import type { Template, TemplateId, TemplateMap, BusyTemplate, LaneTemplate } from '../types/index.js';

export type BusyTemplateUpdates = Partial<Omit<BusyTemplate, 'id' | 'templateType'>>;
export type LaneTemplateUpdates = Partial<Omit<LaneTemplate, 'id' | 'templateType'>>;
export type TemplateUpdates = BusyTemplateUpdates | LaneTemplateUpdates;

export type UpdateTemplateResult = 
  | { success: true; updated: Template }
  | { success: false; error: string };

/**
 * Updates a template by ID in place.
 * Mutates the map for O(1) performance.
 * 
 * @param id - ID of template to update
 * @param updates - Properties to update
 * @param templates - Template map (mutated in place)
 * @returns Result with the updated template or error
 */
export function updateTemplate(
  id: TemplateId,
  updates: TemplateUpdates,
  templates: TemplateMap,
): UpdateTemplateResult {
  const existing = templates[id];
  
  if (!existing) {
    return {
      success: false,
      error: `Template with ID ${id} not found`,
    };
  }

  // Handle double-linking updates if segments are changing
  if (existing.templateType === 'lane' && 'segments' in updates && updates.segments) {
    // Remove old back-links from children
    for (const segment of existing.segments) {
      const child = templates[segment.templateId];
      if (child) {
        child.references = child.references.filter(
          ref => !(ref.parentId === id && ref.relationshipId === segment.relationshipId)
        );
      }
    }

    // Add new back-links to children
    for (const segment of updates.segments) {
      const child = templates[segment.templateId];
      if (child) {
        child.references.push({
          parentId: id,
          relationshipId: segment.relationshipId,
        });
      }
    }
  }

  const updated = { ...existing, ...updates } as Template;
  templates[id] = updated;

  return {
    success: true,
    updated,
  };
}
