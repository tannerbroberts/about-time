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
  inputs: Variable[];
  outputs: Variable[];
}

export function useVariablesList(
  inputsQuery: string,
  outputsQuery: string,
): VariablesListResult {
  const allTemplates = useMemo((): Template[] => {
    const library = templatesData as TemplateLibrary;
    return library.templates;
  }, []);

  const { inputs, outputs } = useMemo((): VariablesListResult => {
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

    const allInputs: Variable[] = Array.from(inputsMap.entries()).map(
      ([name, templateIds]): Variable => ({
        name,
        type: 'input',
        templateIds,
      }),
    );

    const allOutputs: Variable[] = Array.from(outputsMap.entries()).map(
      ([name, templateIds]): Variable => ({
        name,
        type: 'output',
        templateIds,
      }),
    );

    return { inputs: allInputs, outputs: allOutputs };
  }, [allTemplates]);

  // Filter inputs based on inputsQuery
  const filteredInputs = useMemo((): Variable[] => {
    if (!inputsQuery) return inputs;
    return inputs.filter((variable) => fuzzyMatch(variable.name, inputsQuery));
  }, [inputs, inputsQuery]);

  // Filter outputs based on outputsQuery
  const filteredOutputs = useMemo((): Variable[] => {
    if (!outputsQuery) return outputs;
    return outputs.filter((variable) => fuzzyMatch(variable.name, outputsQuery));
  }, [outputs, outputsQuery]);

  return { inputs: filteredInputs, outputs: filteredOutputs };
}
