import { useState, useCallback, useMemo } from 'react';

import templatesData from '../../data/templates.json';
import type { Template, LaneTemplate } from '../Library';

interface TemplateLibrary {
  version: string;
  templates: Template[];
}

interface LaneViewPanelState {
  isExpanded: boolean;
  toggle: () => void;
  query: string;
  setQuery: (value: string) => void;
  suggestions: LaneTemplate[];
  selectedLane: LaneTemplate | null;
  selectLane: (lane: LaneTemplate) => void;
  allTemplates: Template[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
}

export function useLaneViewPanelState(): LaneViewPanelState {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [query, setQueryState] = useState<string>('');
  const [selectedLane, setSelectedLane] = useState<LaneTemplate | null>(null);
  const [showSuggestions, setShowSuggestionsState] = useState<boolean>(false);

  const library = templatesData as TemplateLibrary;
  const allTemplates = library.templates;

  const laneTemplates = useMemo((): LaneTemplate[] => {
    return allTemplates.filter(
      (t): t is LaneTemplate => t.templateType === 'lane',
    );
  }, [allTemplates]);

  const suggestions = useMemo((): LaneTemplate[] => {
    if (!query.trim()) {
      return laneTemplates;
    }
    const lowerQuery = query.toLowerCase();
    return laneTemplates.filter(
      (lane) => lane.intent.toLowerCase().includes(lowerQuery),
    );
  }, [query, laneTemplates]);

  const toggle = useCallback((): void => {
    setIsExpanded((prev) => !prev);
  }, []);

  const setQuery = useCallback((value: string): void => {
    setQueryState(value);
    setShowSuggestionsState(true);
  }, []);

  const selectLane = useCallback((lane: LaneTemplate): void => {
    setSelectedLane(lane);
    setQueryState(lane.intent);
    setShowSuggestionsState(false);
  }, []);

  const setShowSuggestions = useCallback((show: boolean): void => {
    setShowSuggestionsState(show);
  }, []);

  return {
    isExpanded,
    toggle,
    query,
    setQuery,
    suggestions,
    selectedLane,
    selectLane,
    allTemplates,
    showSuggestions,
    setShowSuggestions,
  };
}
