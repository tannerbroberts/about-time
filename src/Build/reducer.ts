import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';
import React from 'react';

export interface BuildState {
  templates: TemplateMap;
  searchQuery: string;
  sortBy: 'recent' | 'name' | 'calories' | 'protein';
  filterTemplateType: 'all' | 'busy' | 'lane';
  isTemplateFormOpen: boolean;
  isTemplateEditorOpen: boolean;
  isSegmentAddModalOpen: boolean;
  editingTemplateId: string | null;
  selectedBaseTemplateId: string | null;
  focusedLineage: string[];
  selectedRegion: { start: number; end: number } | null;
}

export const DefaultBuildState: BuildState = {
  templates: {},
  searchQuery: '',
  sortBy: 'recent',
  filterTemplateType: 'all',
  isTemplateFormOpen: false,
  isTemplateEditorOpen: false,
  isSegmentAddModalOpen: false,
  editingTemplateId: null,
  selectedBaseTemplateId: null,
  focusedLineage: [],
  selectedRegion: null,
};

export type BuildAction = | { type: 'HYDRATE_TEMPLATES'; templates: TemplateMap }
  | { type: 'CREATE_TEMPLATE'; template: Template }
  | { type: 'UPDATE_TEMPLATE'; id: string; template: Template }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_SORT_BY'; sortBy: BuildState['sortBy'] }
  | { type: 'SET_FILTER_TYPE'; filterType: BuildState['filterTemplateType'] }
  | { type: 'OPEN_TEMPLATE_FORM'; templateId?: string }
  | { type: 'CLOSE_TEMPLATE_FORM' }
  | { type: 'OPEN_TEMPLATE_EDITOR'; templateId: string }
  | { type: 'CLOSE_TEMPLATE_EDITOR' }
  | { type: 'OPEN_SEGMENT_ADD_MODAL'; region: { start: number; end: number } }
  | { type: 'CLOSE_SEGMENT_ADD_MODAL' }
  | { type: 'SET_FOCUSED_LINEAGE'; lineage: string[] }
  | { type: 'SELECT_REGION'; region: { start: number; end: number } };

export interface BuildContextValue {
  state: BuildState;
  dispatch: React.Dispatch<BuildAction>;
}

export const reducer = (state: BuildState, action: BuildAction): BuildState => {
  switch (action.type) {
    case 'HYDRATE_TEMPLATES':
      return {
        ...state,
        templates: action.templates,
      };

    case 'CREATE_TEMPLATE':
      return {
        ...state,
        templates: {
          ...state.templates,
          [action.template.id]: action.template,
        },
        isTemplateFormOpen: false,
        editingTemplateId: null,
      };

    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: {
          ...state.templates,
          [action.id]: action.template,
        },
      };

    case 'DELETE_TEMPLATE': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.id]: _deleted, ...remainingTemplates } = state.templates;
      return {
        ...state,
        templates: remainingTemplates,
      };
    }

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.query,
      };

    case 'SET_SORT_BY':
      return {
        ...state,
        sortBy: action.sortBy,
      };

    case 'SET_FILTER_TYPE':
      return {
        ...state,
        filterTemplateType: action.filterType,
      };

    case 'OPEN_TEMPLATE_FORM':
      return {
        ...state,
        isTemplateFormOpen: true,
        editingTemplateId: action.templateId ?? null,
      };

    case 'CLOSE_TEMPLATE_FORM':
      return {
        ...state,
        isTemplateFormOpen: false,
        editingTemplateId: null,
      };

    case 'OPEN_TEMPLATE_EDITOR':
      return {
        ...state,
        isTemplateEditorOpen: true,
        selectedBaseTemplateId: action.templateId,
        focusedLineage: [action.templateId],
      };

    case 'CLOSE_TEMPLATE_EDITOR':
      return {
        ...state,
        isTemplateEditorOpen: false,
        selectedBaseTemplateId: null,
        focusedLineage: [],
        selectedRegion: null,
      };

    case 'OPEN_SEGMENT_ADD_MODAL':
      return {
        ...state,
        isSegmentAddModalOpen: true,
        selectedRegion: action.region,
      };

    case 'CLOSE_SEGMENT_ADD_MODAL':
      return {
        ...state,
        isSegmentAddModalOpen: false,
        selectedRegion: null,
      };

    case 'SET_FOCUSED_LINEAGE':
      return {
        ...state,
        focusedLineage: action.lineage,
      };

    case 'SELECT_REGION':
      return {
        ...state,
        selectedRegion: action.region,
      };

    default:
      throw new Error(`Unhandled action type: ${(action as BuildAction).type}`);
  }
};
