import {
  createComposite as createCompositeAPI,
  getUserComposites as getUserCompositesAPI,
} from '@about-time/api-client/composites';
import {
  fetchLibraries as fetchLibrariesAPI,
  createLibrary as createLibraryAPI,
  updateLibrary as updateLibraryAPI,
  deleteLibrary as deleteLibraryAPI,
  getLibraryTemplates as getLibraryTemplatesAPI,
  addTemplateToLibrary as addTemplateToLibraryAPI,
  removeTemplateFromLibrary as removeTemplateFromLibraryAPI,
} from '@about-time/api-client/libraries';
import {
  publishTemplate as publishTemplateAPI,
  unpublishTemplate as unpublishTemplateAPI,
  fetchPublicTemplates as fetchPublicTemplatesAPI,
  importPublicTemplate as importPublicTemplateAPI,
} from '@about-time/api-client/templates';
import type { CompositeUnitDefinition } from '@about-time/types/composite';
import type { ValueWithConfidence } from '@about-time/types/confidence';
import type { Library } from '@about-time/types/library';
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
  deduplicateLibraries: boolean;
  variableViewMode: 'composite' | 'expanded';

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

  // Library management
  libraries: Record<string, Library>;
  selectedLibraryId: string | null;
  libraryTemplates: Record<string, Template[]>;
  isLibraryBrowserOpen: boolean;
  isLibraryFormOpen: boolean;
  editingLibraryId: string | null;

  // Composite variables
  composites: Record<string, CompositeUnitDefinition>;
  isCompositeDialogOpen: boolean;

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
  setDeduplicateLibraries: (deduplicate: boolean) => void;
  setVariableViewMode: (mode: BuildState['variableViewMode']) => void;

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

  // Library management actions
  loadLibraries: () => Promise<void>;
  createLibrary: (name: string, description?: string, laneTemplateId?: string) => Promise<void>;
  updateLibrary: (libraryId: string, name?: string, description?: string) => Promise<void>;
  deleteLibrary: (libraryId: string) => Promise<void>;
  selectLibrary: (libraryId: string | null) => void;
  loadLibraryTemplates: (libraryId: string) => Promise<void>;
  addTemplateToLibrary: (libraryId: string, templateId: string) => Promise<void>;
  removeTemplateFromLibrary: (libraryId: string, templateId: string) => Promise<void>;
  openLibraryBrowser: () => void;
  closeLibraryBrowser: () => void;
  openLibraryForm: (libraryId?: string) => void;
  closeLibraryForm: () => void;

  // Composite variable actions
  loadComposites: () => Promise<void>;
  createComposite: (data: {
    name: string;
    composition: Record<string, ValueWithConfidence>;
    isPublic: boolean;
    changelog?: string;
  }) => Promise<void>;
  openCompositeDialog: () => void;
  closeCompositeDialog: () => void;

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

// Load deduplication preference from localStorage
const loadDeduplicationPreference = (): boolean => {
  try {
    const saved = localStorage.getItem('deduplicateLibraries');
    return saved === 'true';
  } catch {
    return false;
  }
};

// Load variable view mode preference from localStorage
const loadVariableViewModePreference = (): 'composite' | 'expanded' => {
  try {
    const saved = localStorage.getItem('variableViewMode');
    return saved === 'expanded' ? 'expanded' : 'composite';
  } catch {
    return 'composite';
  }
};

const defaultState: BuildState = {
  templates: {},
  searchQuery: '',
  sortBy: 'recent',
  filterTemplateType: 'all',
  deduplicateLibraries: loadDeduplicationPreference(),
  variableViewMode: loadVariableViewModePreference(),
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
  libraries: {},
  selectedLibraryId: null,
  libraryTemplates: {},
  isLibraryBrowserOpen: false,
  isLibraryFormOpen: false,
  editingLibraryId: null,
  composites: {},
  isCompositeDialogOpen: false,
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

  setDeduplicateLibraries: (deduplicate): void => {
    try {
      localStorage.setItem('deduplicateLibraries', String(deduplicate));
    } catch {
      // Ignore localStorage errors
    }
    set({ deduplicateLibraries: deduplicate });
  },

  setVariableViewMode: (mode): void => {
    try {
      localStorage.setItem('variableViewMode', mode);
    } catch {
      // Ignore localStorage errors
    }
    set({ variableViewMode: mode });
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

  // Library management actions
  loadLibraries: async (): Promise<void> => {
    try {
      const libraries = await fetchLibrariesAPI();
      const librariesMap: Record<string, Library> = {};
      for (const library of libraries) {
        librariesMap[library.id] = library;
      }
      set({ libraries: librariesMap });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load libraries:', error);
      useBuildStore.getState().showNotification('Failed to load libraries', 'error');
    }
  },

  createLibrary: async (name, description, laneTemplateId): Promise<void> => {
    try {
      const created = await createLibraryAPI({ name, description, laneTemplateId });
      set((state) => ({
        libraries: {
          ...state.libraries,
          [created.id]: created,
        },
        isLibraryFormOpen: false,
        editingLibraryId: null,
      }));
      useBuildStore.getState().showNotification('Library created successfully!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create library:', error);
      useBuildStore.getState().showNotification('Failed to create library', 'error');
      throw error;
    }
  },

  updateLibrary: async (libraryId, name, description): Promise<void> => {
    try {
      const updated = await updateLibraryAPI(libraryId, { name, description });
      set((state) => ({
        libraries: {
          ...state.libraries,
          [libraryId]: updated,
        },
        isLibraryFormOpen: false,
        editingLibraryId: null,
      }));
      useBuildStore.getState().showNotification('Library updated successfully!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update library:', error);
      useBuildStore.getState().showNotification('Failed to update library', 'error');
      throw error;
    }
  },

  deleteLibrary: async (libraryId): Promise<void> => {
    try {
      await deleteLibraryAPI(libraryId);
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [libraryId]: _removed, ...remaining } = state.libraries;
        return {
          libraries: remaining,
          selectedLibraryId: state.selectedLibraryId === libraryId ? null : state.selectedLibraryId,
        };
      });
      useBuildStore.getState().showNotification('Library deleted successfully!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete library:', error);
      useBuildStore.getState().showNotification('Failed to delete library', 'error');
      throw error;
    }
  },

  selectLibrary: (libraryId): void => {
    set({ selectedLibraryId: libraryId });
    if (libraryId) {
      useBuildStore.getState().loadLibraryTemplates(libraryId);
    }
  },

  loadLibraryTemplates: async (libraryId): Promise<void> => {
    try {
      const results = await getLibraryTemplatesAPI(libraryId);
      const templates = results.map((r) => r.template);
      set((state) => ({
        libraryTemplates: {
          ...state.libraryTemplates,
          [libraryId]: templates,
        },
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load library templates:', error);
      useBuildStore.getState().showNotification('Failed to load library templates', 'error');
    }
  },

  addTemplateToLibrary: async (libraryId, templateId): Promise<void> => {
    try {
      await addTemplateToLibraryAPI(libraryId, { templateId });

      // Refresh library templates
      await useBuildStore.getState().loadLibraryTemplates(libraryId);

      // Update library template count
      set((state) => {
        const library = state.libraries[libraryId];
        if (library) {
          return {
            libraries: {
              ...state.libraries,
              [libraryId]: {
                ...library,
                templateCount: library.templateCount + 1,
              },
            },
          };
        }
        return {};
      });

      useBuildStore.getState().showNotification('Template added to library!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add template to library:', error);
      useBuildStore.getState().showNotification('Failed to add template to library', 'error');
      throw error;
    }
  },

  removeTemplateFromLibrary: async (libraryId, templateId): Promise<void> => {
    try {
      await removeTemplateFromLibraryAPI(libraryId, templateId);

      // Refresh library templates
      await useBuildStore.getState().loadLibraryTemplates(libraryId);

      // Update library template count
      set((state) => {
        const library = state.libraries[libraryId];
        if (library) {
          return {
            libraries: {
              ...state.libraries,
              [libraryId]: {
                ...library,
                templateCount: Math.max(0, library.templateCount - 1),
              },
            },
          };
        }
        return {};
      });

      useBuildStore.getState().showNotification('Template removed from library!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to remove template from library:', error);
      useBuildStore.getState().showNotification('Failed to remove template from library', 'error');
      throw error;
    }
  },

  openLibraryBrowser: (): void => {
    set({ isLibraryBrowserOpen: true });
    useBuildStore.getState().loadLibraries();
  },

  closeLibraryBrowser: (): void => {
    set({ isLibraryBrowserOpen: false, selectedLibraryId: null });
  },

  openLibraryForm: (libraryId): void => {
    set({
      isLibraryFormOpen: true,
      editingLibraryId: libraryId || null,
    });
  },

  closeLibraryForm: (): void => {
    set({
      isLibraryFormOpen: false,
      editingLibraryId: null,
    });
  },

  // Composite variable actions
  loadComposites: async (): Promise<void> => {
    try {
      const composites = await getUserCompositesAPI();
      const compositesMap: Record<string, CompositeUnitDefinition> = {};
      for (const composite of composites) {
        compositesMap[composite.id] = composite;
      }
      set({ composites: compositesMap });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load composites:', error);
      useBuildStore.getState().showNotification('Failed to load composite variables', 'error');
    }
  },

  createComposite: async (data): Promise<void> => {
    try {
      const created = await createCompositeAPI(data);
      set((state) => ({
        composites: {
          ...state.composites,
          [created.id]: created,
        },
        isCompositeDialogOpen: false,
      }));
      useBuildStore.getState().showNotification('Composite variable created successfully!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create composite:', error);
      useBuildStore.getState().showNotification('Failed to create composite variable', 'error');
      throw error;
    }
  },

  openCompositeDialog: (): void => {
    set({ isCompositeDialogOpen: true });
  },

  closeCompositeDialog: (): void => {
    set({ isCompositeDialogOpen: false });
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
