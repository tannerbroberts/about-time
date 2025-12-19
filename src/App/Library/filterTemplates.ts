import type { LibraryFilters, Template } from './types';

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Simple fuzzy match: check if all characters in query appear in order in text
  let textIndex = 0;
  for (const char of lowerQuery) {
    const foundIndex = lowerText.indexOf(char, textIndex);
    if (foundIndex === -1) {
      return false;
    }
    textIndex = foundIndex + 1;
  }
  return true;
}

function matchesVariables(variables: Record<string, number>, query: string): boolean {
  if (!query) return true;
  const variableNames = Object.keys(variables);
  return variableNames.some((name) => fuzzyMatch(name, query));
}

export function filterTemplates(
  templates: Template[],
  filters: LibraryFilters,
): Template[] {
  return templates.filter((template) => {
    // Filter by duration
    if (filters.minDuration !== null && template.estimatedDuration < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration !== null && template.estimatedDuration > filters.maxDuration) {
      return false;
    }

    // Filter by intent
    if (filters.intentQuery && !fuzzyMatch(template.intent, filters.intentQuery)) {
      return false;
    }

    // Filter by inputs (willConsume) - only applicable to busy templates
    if (filters.inputsQuery) {
      if (template.templateType === 'busy') {
        if (!matchesVariables(template.willConsume, filters.inputsQuery)) {
          return false;
        }
      } else {
        // Lane templates don't have willConsume, so they don't match input filters
        return false;
      }
    }

    // Filter by outputs (willProduce) - only applicable to busy templates
    if (filters.outputsQuery) {
      if (template.templateType === 'busy') {
        if (!matchesVariables(template.willProduce, filters.outputsQuery)) {
          return false;
        }
      } else {
        // Lane templates don't have willProduce, so they don't match output filters
        return false;
      }
    }

    return true;
  });
}
