import {
  publishTemplate as publishTemplateAPI,
  unpublishTemplate as unpublishTemplateAPI,
  fetchPublicTemplates as fetchPublicTemplatesAPI,
  importPublicTemplate as importPublicTemplateAPI,
} from '@about-time/api-client/templates';
import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';
import type React from 'react';
import { create } from 'zustand';

import {
  loadTemplates,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  saveToLocalStorage,
} from './utils/localStorage';

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
  creationTemplateType: 'busy' | 'lane' | null;

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

  // Action menu state
  isActionMenuOpen: boolean;
  actionMenuPosition: { x: number; y: number } | null;
  menuPath: string[];

  // Public template browsing
  publicTemplates: TemplateMap;
  publicTemplateAuthors: Record<string, string>;
  publicSearchQuery: string;
  isPublicLibraryOpen: boolean;

  // Notifications
  notifications: Array<{
    id: string;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
    duration?: number;
    action?: React.ReactNode;
  }>;
}

export interface BuildActions {
  // Template CRUD
  hydrateTemplates: (templates: TemplateMap) => void;
  loadTemplatesFromAPI: () => Promise<void>;
  createTemplate: (template: Template) => Promise<void>;
  updateTemplate: (id: string, template: Template) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Library actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: BuildState['sortBy']) => void;
  setFilterType: (filterType: BuildState['filterTemplateType']) => void;

  // Form actions
  openTemplateForm: (templateId?: string, preselectedType?: 'busy' | 'lane') => void;
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
  setSelectedRegion: (region: { start: number; end: number } | null) => void;
  toggleAddSegmentMode: () => void;
  openSegmentAddOverlay: (region: { start: number; end: number }, position: { x: number; y: number }) => void;
  closeSegmentAddOverlay: () => void;

  // Base template selection actions
  openBaseTemplateSelection: () => void;
  closeBaseTemplateSelection: () => void;
  selectBaseTemplate: (templateId: string) => void;

  // Action menu actions
  openActionMenu: (position: { x: number; y: number }) => void;
  closeActionMenu: () => void;
  navigateMenuPath: (path: string[]) => void;
  goBackInMenu: () => void;
  resetMenuPath: () => void;

  // Public library actions
  loadPublicTemplates: (searchQuery?: string) => Promise<void>;
  setPublicSearchQuery: (query: string) => void;
  openPublicLibrary: () => void;
  closePublicLibrary: () => void;
  importPublicTemplate: (publicTemplateId: string) => Promise<void>;

  // Publishing actions
  publishTemplate: (templateId: string) => Promise<void>;
  unpublishTemplate: (templateId: string) => Promise<void>;

  // Notification actions
  showNotification: (
    message: string,
    severity?: 'success' | 'info' | 'warning' | 'error',
    duration?: number,
    action?: React.ReactNode,
  ) => void;
  dismissNotification: (id: string) => void;
}

export type BuildStore = BuildState & BuildActions;

const defaultState: BuildState = {
  templates: {},
  searchQuery: '',
  sortBy: 'recent',
  filterTemplateType: 'all',
  isTemplateFormOpen: false,
  editingTemplateId: null,
  creationTemplateType: null,
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
  isActionMenuOpen: false,
  actionMenuPosition: null,
  menuPath: ['root'],
  publicTemplates: {},
  publicTemplateAuthors: {},
  publicSearchQuery: '',
  isPublicLibraryOpen: false,
  notifications: [],
};

export const useBuildStore = create<BuildStore>((set) => ({
  ...defaultState,

  // Template CRUD
  hydrateTemplates: (templates): void => {
    set({ templates });
    saveToLocalStorage(templates);
  },

  loadTemplatesFromAPI: async (): Promise<void> => {
    try {
      const templates = await loadTemplates();
      set({ templates });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load templates:', error);
    }
  },

  createTemplate: async (template): Promise<void> => {
    // Optimistic update
    set((state) => ({
      templates: {
        ...state.templates,
        [template.id]: template,
      },
      isTemplateFormOpen: false,
      editingTemplateId: null,
    }));

    try {
      await apiCreateTemplate(template);
      // Update cache
      set((state) => {
        saveToLocalStorage(state.templates);
        return {};
      });
    } catch (error) {
      // Revert on error
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [template.id]: _removed, ...remaining } = state.templates;
        return { templates: remaining };
      });
      throw error;
    }
  },

  updateTemplate: async (id, template): Promise<void> => {
    const previousTemplate = useBuildStore.getState().templates[id];

    // Optimistic update
    set((state) => ({
      templates: {
        ...state.templates,
        [id]: template,
      },
    }));

    try {
      await apiUpdateTemplate(template);
      // Update cache
      set((state) => {
        saveToLocalStorage(state.templates);
        return {};
      });
    } catch (error) {
      // Revert on error
      set((state) => ({
        templates: {
          ...state.templates,
          [id]: previousTemplate,
        },
      }));
      throw error;
    }
  },

  deleteTemplate: async (id): Promise<void> => {
    const previousTemplate = useBuildStore.getState().templates[id];

    // Optimistic update
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _deleted, ...remainingTemplates } = state.templates;
      return { templates: remainingTemplates };
    });

    try {
      await apiDeleteTemplate(id);
      // Update cache
      set((state) => {
        saveToLocalStorage(state.templates);
        return {};
      });
    } catch (error) {
      // Revert on error
      set((state) => ({
        templates: {
          ...state.templates,
          [id]: previousTemplate,
        },
      }));
      throw error;
    }
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
  openTemplateForm: (templateId?, preselectedType?): void => {
    set({
      isTemplateFormOpen: true,
      editingTemplateId: templateId ?? null,
      creationTemplateType: templateId ? null : (preselectedType ?? null),
    });
  },

  closeTemplateForm: (): void => {
    set({
      isTemplateFormOpen: false,
      editingTemplateId: null,
      creationTemplateType: null,
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

  setSelectedRegion: (region): void => {
    set({ selectedRegion: region });
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

  // Action menu actions
  openActionMenu: (position): void => {
    set({
      isActionMenuOpen: true,
      actionMenuPosition: position,
      menuPath: ['root'],
    });
  },

  closeActionMenu: (): void => {
    set({
      isActionMenuOpen: false,
      actionMenuPosition: null,
      menuPath: ['root'],
    });
  },

  navigateMenuPath: (path): void => {
    set({ menuPath: path });
  },

  goBackInMenu: (): void => {
    set((state) => {
      const newPath = state.menuPath.slice(0, -1);
      return { menuPath: newPath.length > 0 ? newPath : ['root'] };
    });
  },

  resetMenuPath: (): void => {
    set({ menuPath: ['root'] });
  },

  // Publishing actions
  publishTemplate: async (templateId): Promise<void> => {
    try {
      const published = await publishTemplateAPI(templateId);

      set((state) => ({
        templates: {
          ...state.templates,
          [templateId]: published,
        },
      }));

      useBuildStore.getState().showNotification('Template published successfully!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to publish template:', error);
      useBuildStore.getState().showNotification('Failed to publish template', 'error');
    }
  },

  unpublishTemplate: async (templateId): Promise<void> => {
    try {
      const unpublished = await unpublishTemplateAPI(templateId);

      set((state) => ({
        templates: {
          ...state.templates,
          [templateId]: unpublished,
        },
      }));

      useBuildStore.getState().showNotification('Template unpublished successfully!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to unpublish template:', error);
      useBuildStore.getState().showNotification('Failed to unpublish template', 'error');
    }
  },

  // Public library actions
  loadPublicTemplates: async (searchQuery): Promise<void> => {
    try {
      const result = await fetchPublicTemplatesAPI({
        searchIntent: searchQuery,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
        limit: 100,
      });

      const publicTemplateMap: TemplateMap = {};
      for (const template of result.templates) {
        publicTemplateMap[template.id] = template;
      }

      set({
        publicTemplates: publicTemplateMap,
        publicTemplateAuthors: result.authors,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load public templates:', error);
      useBuildStore.getState().showNotification('Failed to load public templates', 'error');
    }
  },

  setPublicSearchQuery: (query): void => {
    set({ publicSearchQuery: query });
    useBuildStore.getState().loadPublicTemplates(query);
  },

  openPublicLibrary: (): void => {
    set({ isPublicLibraryOpen: true });
    useBuildStore.getState().loadPublicTemplates();
  },

  closePublicLibrary: (): void => {
    set({ isPublicLibraryOpen: false });
  },

  importPublicTemplate: async (publicTemplateId): Promise<void> => {
    try {
      const imported = await importPublicTemplateAPI(publicTemplateId);

      set((state) => ({
        templates: {
          ...state.templates,
          [imported.id]: imported,
        },
      }));

      useBuildStore.getState().showNotification('Template imported successfully!', 'success');
      useBuildStore.getState().closePublicLibrary();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to import template:', error);
      useBuildStore.getState().showNotification('Failed to import template', 'error');
    }
  },

  // Notification actions
  showNotification: (message, severity = 'success', duration = 3000, action = undefined): void => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { id, message, severity, duration, action }],
    }));
  },

  dismissNotification: (id): void => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));

// Note: Templates are loaded on mount in Build component via loadTemplatesFromAPI()
