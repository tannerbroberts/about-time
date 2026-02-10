export interface TemplateWithSegments {
  id: string;
  segments?: Array<{ templateId: string }>;
}

/**
 * Check if adding a template as a segment would create a circular dependency
 * Example: If A contains B, and we try to add A to B, this would create A → B → A cycle
 * @param parentId - ID of the template that would contain the new segment
 * @param candidateId - ID of the template being considered as a segment
 * @param templates - Map of all templates
 * @returns true if adding candidateId to parentId would create a circular dependency
 */
export function wouldCreateCircularDependency(
  parentId: string,
  candidateId: string,
  templates: Record<string, TemplateWithSegments>,
): boolean {
  // A template cannot contain itself
  if (parentId === candidateId) {
    return true;
  }

  // Check if candidate already contains parent (directly or indirectly)
  return containsTemplate(candidateId, parentId, templates, new Set());
}

/**
 * Recursively check if a template contains another template in its hierarchy
 * @param searchInId - Template to search within
 * @param searchForId - Template ID to look for
 * @param templates - Map of all templates
 * @param visited - Set to track visited templates and prevent infinite loops
 * @returns true if searchForId is found anywhere in searchInId's hierarchy
 */
function containsTemplate(
  searchInId: string,
  searchForId: string,
  templates: Record<string, TemplateWithSegments>,
  visited: Set<string>,
): boolean {
  // Prevent infinite recursion
  if (visited.has(searchInId)) {
    return false;
  }

  visited.add(searchInId);

  const template = templates[searchInId];
  if (!template || !template.segments) {
    return false;
  }

  // Check each segment
  for (const segment of template.segments) {
    // Direct match
    if (segment.templateId === searchForId) {
      return true;
    }

    // Recursive search in child segments
    if (containsTemplate(segment.templateId, searchForId, templates, visited)) {
      return true;
    }
  }

  return false;
}
