import { useState, useCallback, useMemo } from 'react';

import templatesData from '../../data/templates.json';

import { filterTemplates } from './filterTemplates';
import type { LibraryFilters, Template, Variable } from './types';
import { useVariablesList } from './useVariablesList';

interface TemplateLibrary {
  version: string;
  templates: Template[];
}

interface LibraryState {
  templates: Template[];
  variables: Variable[];
  filters: LibraryFilters;
  minDurationInput: string;
  maxDurationInput: string;
  setMinDurationInput: (value: string) => void;
  setMaxDurationInput: (value: string) => void;
  setVariablesQuery: (value: string) => void;
  setIntentQuery: (value: string) => void;
  clearFilters: () => void;
}

const initialFilters: LibraryFilters = {
  minDuration: null,
  maxDuration: null,
  variablesQuery: '',
  intentQuery: '',
};

export function useLibraryState(): LibraryState {
  const [filters, setFilters] = useState<LibraryFilters>(initialFilters);
  const [minDurationInput, setMinDurationInputState] = useState<string>('');
  const [maxDurationInput, setMaxDurationInputState] = useState<string>('');

  // Load all templates from the shared JSON file
  const allTemplates = useMemo((): Template[] => {
    const library = templatesData as TemplateLibrary;
    return library.templates;
  }, []);

  // Filter templates based on current filters
  const templates = useMemo(
    (): Template[] => filterTemplates(allTemplates, filters),
    [allTemplates, filters],
  );

  // Get filtered variables
  const { variables } = useVariablesList(filters.variablesQuery);

  const setMinDurationInput = useCallback((value: string): void => {
    setMinDurationInputState(value);
    const parsed = value === '' ? null : parseFloat(value) * 60000; // Convert minutes to ms
    setFilters((prev) => ({ ...prev, minDuration: parsed }));
  }, []);

  const setMaxDurationInput = useCallback((value: string): void => {
    setMaxDurationInputState(value);
    const parsed = value === '' ? null : parseFloat(value) * 60000; // Convert minutes to ms
    setFilters((prev) => ({ ...prev, maxDuration: parsed }));
  }, []);

  const setVariablesQuery = useCallback((value: string): void => {
    setFilters((prev) => ({ ...prev, variablesQuery: value }));
  }, []);

  const setIntentQuery = useCallback((value: string): void => {
    setFilters((prev) => ({ ...prev, intentQuery: value }));
  }, []);

  const clearFilters = useCallback((): void => {
    setFilters(initialFilters);
    setMinDurationInputState('');
    setMaxDurationInputState('');
  }, []);

  return {
    templates,
    variables,
    filters,
    minDurationInput,
    maxDurationInput,
    setMinDurationInput,
    setMaxDurationInput,
    setVariablesQuery,
    setIntentQuery,
    clearFilters,
  };
}
