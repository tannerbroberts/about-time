/**
 * Template deduplication utilities for library views
 */

import type { Template } from '@tannerbroberts/about-time-core';

export interface DeduplicatedTemplate {
  template: Template;
  libraryIds: string[];
  libraryNames: string[];
}

/**
 * Deduplicate templates across libraries
 *
 * Groups templates by ID and tracks which libraries contain each template
 */
export function deduplicateTemplates(
  templates: Template[],
  libraryTemplates: Record<string, Template[]>,
  libraries: Record<string, { id: string; name: string }>,
): DeduplicatedTemplate[] {
  const templateMap = new Map<string, DeduplicatedTemplate>();

  // First pass: collect all unique templates
  for (const template of templates) {
    if (!templateMap.has(template.id)) {
      templateMap.set(template.id, {
        template,
        libraryIds: [],
        libraryNames: [],
      });
    }
  }

  // Second pass: map templates to their libraries
  for (const [libraryId, libTemplates] of Object.entries(libraryTemplates)) {
    const library = libraries[libraryId];
    if (!library) continue;

    for (const template of libTemplates) {
      const dedupEntry = templateMap.get(template.id);
      if (dedupEntry && !dedupEntry.libraryIds.includes(libraryId)) {
        dedupEntry.libraryIds.push(libraryId);
        dedupEntry.libraryNames.push(library.name);
      }
    }
  }

  return Array.from(templateMap.values());
}

/**
 * Filter templates by search query
 */
export function filterTemplatesBySearch(templates: Template[], searchQuery: string): Template[] {
  if (!searchQuery.trim()) {
    return templates;
  }

  const query = searchQuery.toLowerCase();
  return templates.filter((template) => {
    return template.intent.toLowerCase().includes(query);
  });
}

/**
 * Get deduplicated and filtered templates
 */
export function getProcessedTemplates(
  allTemplates: Template[],
  libraryTemplates: Record<string, Template[]>,
  libraries: Record<string, { id: string; name: string }>,
  searchQuery: string,
  deduplicate: boolean,
): {
  templates: Template[];
  deduplicatedTemplates: DeduplicatedTemplate[];
  uniqueCount: number;
  totalCount: number;
} {
  // Apply search filter first
  const filtered = filterTemplatesBySearch(allTemplates, searchQuery);

  if (!deduplicate) {
    return {
      templates: filtered,
      deduplicatedTemplates: [],
      uniqueCount: filtered.length,
      totalCount: filtered.length,
    };
  }

  // Deduplicate
  const deduplicated = deduplicateTemplates(filtered, libraryTemplates, libraries);

  return {
    templates: [],
    deduplicatedTemplates: deduplicated,
    uniqueCount: deduplicated.length,
    totalCount: filtered.length,
  };
}
