import type { VariableName, TemplateMap } from '../types/index.js';

/**
 * Extracts all unique variable names from template StateLedgers.
 * Note: Iterates all templates—O(n).
 * 
 * @param templates - Template map
 * @returns Sorted array of unique variable names
 */
export function getVocabulary(templates: TemplateMap): VariableName[] {
  const variables = new Set<VariableName>();

  for (const template of Object.values(templates)) {
    if (template.templateType === 'busy') {
      const busy = template;
      for (const varName of Object.keys(busy.willConsume)) {
        variables.add(varName);
      }
      for (const varName of Object.keys(busy.willProduce)) {
        variables.add(varName);
      }
    }
  }

  return Array.from(variables).sort((a, b) => a.localeCompare(b));
}
