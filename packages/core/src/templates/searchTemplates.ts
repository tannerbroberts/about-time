import type { Template, TemplateMap } from '../types/index.js';

/**
 * Searches templates by intent (case-insensitive substring match).
 * Note: Iterates all templates—O(n). For large maps, consider indexing.
 * 
 * @param query - Search string
 * @param templates - Template map to search
 * @returns Templates whose intent contains the query
 */
export function searchTemplates(
  query: string,
  templates: TemplateMap,
): Template[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(templates).filter(t => 
    t.intent.toLowerCase().includes(lowerQuery)
  );
}
