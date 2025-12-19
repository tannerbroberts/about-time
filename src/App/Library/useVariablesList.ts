import { useMemo } from 'react';

import templatesData from '../../data/templates.json';

import type { Template, BusyTemplate, Variable } from './types';

interface TemplateLibrary {
  version: string;
  templates: Template[];
}

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

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

interface VariablesListResult {
  variables: Variable[];
}

export function useVariablesList(
  variablesQuery: string,
): VariablesListResult {
  const allTemplates = useMemo((): Template[] => {
    const library = templatesData as TemplateLibrary;
    return library.templates;
  }, []);

  const variables = useMemo((): Variable[] => {
    const inputsMap = new Map<string, string[]>();
    const outputsMap = new Map<string, string[]>();

    for (const template of allTemplates) {
      if (template.templateType === 'busy') {
        const busyTemplate = template as BusyTemplate;

        // Collect inputs (willConsume)
        for (const variableName of Object.keys(busyTemplate.willConsume)) {
          const existing = inputsMap.get(variableName) ?? [];
          existing.push(template.id);
          inputsMap.set(variableName, existing);
        }

        // Collect outputs (willProduce)
        for (const variableName of Object.keys(busyTemplate.willProduce)) {
          const existing = outputsMap.get(variableName) ?? [];
          existing.push(template.id);
          outputsMap.set(variableName, existing);
        }
      }
    }

    // Merge all variable names
    const allNames = new Set([...inputsMap.keys(), ...outputsMap.keys()]);

    const mergedVariables: Variable[] = Array.from(allNames).map(
      (name): Variable => {
        const isInput = inputsMap.has(name);
        const isOutput = outputsMap.has(name);
        const inputTemplateIds = inputsMap.get(name) ?? [];
        const outputTemplateIds = outputsMap.get(name) ?? [];
        const allTemplateIds = [...new Set([...inputTemplateIds, ...outputTemplateIds])];

        let type: 'input' | 'output' | 'both';
        if (isInput && isOutput) {
          type = 'both';
        } else if (isInput) {
          type = 'input';
        } else {
          type = 'output';
        }

        return {
          name,
          type,
          templateIds: allTemplateIds,
        };
      },
    );

    return mergedVariables;
  }, [allTemplates]);

  // Filter variables based on query
  const filteredVariables = useMemo((): Variable[] => {
    if (!variablesQuery) return variables;
    return variables.filter((variable) => fuzzyMatch(variable.name, variablesQuery));
  }, [variables, variablesQuery]);

  return { variables: filteredVariables };
}
