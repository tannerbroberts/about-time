import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';
import { create } from 'zustand';

import { loadTemplates, saveTemplates } from './utils/localStorage';

export interface FocusPathItem {
  templateId: string;
  offset?: number; // undefined for base template, number for segments
}

export interface BuildState {
  // Core template data
  templates: TemplateMap;

  // Library UI state
  searchQuery: string;
  sortBy: 'recent' | 'name' | 'calories' | 'protein';
  filterTemplateType: 'all' | 'busy' | 'lane';

  // Form state
  isTemplateFormOpen: boolean;
  editingTemplateId: string | null;

  // Editor state
  isTemplateEditorOpen: boolean;
  selectedBaseTemplateId: string | null;
  focusedLineage: FocusPathItem[];
  maxDepth: number;
  zoomLevel: number;

  // Segment addition state
  isSegmentAddModalOpen: boolean;
  isAddingSegment: boolean;
  selectedRegion: { start: number; end: number } | null;
  isSegmentAddOverlayOpen: boolean;
  overlayPosition: { x: number; y: number } | null;

  // Base template selection state
  isBaseTemplateSelectionOpen: boolean;
}

export interface BuildActions {
  // Template CRUD
  hydrateTemplates: (templates: TemplateMap) => void;
  createTemplate: (template: Template) => void;
  updateTemplate: (id: string, template: Template) => void;
  deleteTemplate: (id: string) => void;

  // Library actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: BuildState['sortBy']) => void;
  setFilterType: (filterType: BuildState['filterTemplateType']) => void;

  // Form actions
  openTemplateForm: (templateId?: string) => void;
  closeTemplateForm: () => void;

  // Editor actions
  openTemplateEditor: (templateId: string) => void;
  closeTemplateEditor: () => void;
  setFocusedLineage: (lineage: FocusPathItem[]) => void;
  setMaxDepth: (depth: number) => void;
  setZoomLevel: (level: number) => void;

  // Segment addition actions
  openSegmentAddModal: (region: { start: number; end: number }) => void;
  closeSegmentAddModal: () => void;
  toggleAddSegmentMode: () => void;
  openSegmentAddOverlay: (region: { start: number; end: number }, position: { x: number; y: number }) => void;
  closeSegmentAddOverlay: () => void;

  // Base template selection actions
  openBaseTemplateSelection: () => void;
  closeBaseTemplateSelection: () => void;
  selectBaseTemplate: (templateId: string) => void;
}

export type BuildStore = BuildState & BuildActions;

const defaultState: BuildState = {
  templates: {},
  searchQuery: '',
  sortBy: 'recent',
  filterTemplateType: 'all',
  isTemplateFormOpen: false,
  editingTemplateId: null,
  isTemplateEditorOpen: false,
  selectedBaseTemplateId: null,
  focusedLineage: [],
  maxDepth: 5,
  zoomLevel: 1.0,
  isSegmentAddModalOpen: false,
  isAddingSegment: false,
  selectedRegion: null,
  isSegmentAddOverlayOpen: false,
  overlayPosition: null,
  isBaseTemplateSelectionOpen: false,
};

export const useBuildStore = create<BuildStore>((set) => ({
  ...defaultState,

  // Template CRUD
  hydrateTemplates: (templates): void => {
    set({ templates });
  },

  createTemplate: (template): void => {
    set((state) => {
      const newTemplates = {
        ...state.templates,
        [template.id]: template,
      };
      saveTemplates(newTemplates);
      return {
        templates: newTemplates,
        isTemplateFormOpen: false,
        editingTemplateId: null,
      };
    });
  },

  updateTemplate: (id, template): void => {
    set((state) => {
      const newTemplates = {
        ...state.templates,
        [id]: template,
      };
      saveTemplates(newTemplates);
      return {
        templates: newTemplates,
      };
    });
  },

  deleteTemplate: (id): void => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _deleted, ...remainingTemplates } = state.templates;
      saveTemplates(remainingTemplates);
      return {
        templates: remainingTemplates,
      };
    });
  },

  // Library actions
  setSearchQuery: (query): void => {
    set({ searchQuery: query });
  },

  setSortBy: (sortBy): void => {
    set({ sortBy });
  },

  setFilterType: (filterType): void => {
    set({ filterTemplateType: filterType });
  },

  // Form actions
  openTemplateForm: (templateId?): void => {
    set({
      isTemplateFormOpen: true,
      editingTemplateId: templateId ?? null,
    });
  },

  closeTemplateForm: (): void => {
    set({
      isTemplateFormOpen: false,
      editingTemplateId: null,
    });
  },

  // Editor actions
  openTemplateEditor: (templateId): void => {
    set({
      isTemplateEditorOpen: true,
      selectedBaseTemplateId: templateId,
      focusedLineage: [{ templateId }],
    });
  },

  closeTemplateEditor: (): void => {
    set({
      isTemplateEditorOpen: false,
      selectedBaseTemplateId: null,
      focusedLineage: [],
      selectedRegion: null,
      isAddingSegment: false,
    });
  },

  setFocusedLineage: (lineage): void => {
    set({ focusedLineage: lineage });
  },

  setMaxDepth: (depth): void => {
    set({ maxDepth: depth });
  },

  setZoomLevel: (level): void => {
    set({ zoomLevel: level });
  },

  // Segment addition actions
  openSegmentAddModal: (region): void => {
    set({
      isSegmentAddModalOpen: true,
      selectedRegion: region,
    });
  },

  closeSegmentAddModal: (): void => {
    set({
      isSegmentAddModalOpen: false,
      selectedRegion: null,
    });
  },

  toggleAddSegmentMode: (): void => {
    set((state) => ({
      isAddingSegment: !state.isAddingSegment,
      selectedRegion: state.isAddingSegment ? null : state.selectedRegion,
    }));
  },

  openSegmentAddOverlay: (region, position): void => {
    set({
      isSegmentAddOverlayOpen: true,
      selectedRegion: region,
      overlayPosition: position,
    });
  },

  closeSegmentAddOverlay: (): void => {
    set({
      isSegmentAddOverlayOpen: false,
      overlayPosition: null,
    });
  },

  // Base template selection actions
  openBaseTemplateSelection: (): void => {
    set({ isBaseTemplateSelectionOpen: true });
  },

  closeBaseTemplateSelection: (): void => {
    set({ isBaseTemplateSelectionOpen: false });
  },

  selectBaseTemplate: (templateId): void => {
    set({
      selectedBaseTemplateId: templateId,
      focusedLineage: [{ templateId }],
      isBaseTemplateSelectionOpen: false,
    });
  },
}));

// Initialize store with data from localStorage on module load
const initialTemplates = loadTemplates();
if (Object.keys(initialTemplates).length > 0) {
  useBuildStore.getState().hydrateTemplates(initialTemplates);
}
