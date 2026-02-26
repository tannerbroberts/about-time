import {
  fetchTemplateMap,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
} from '@about-time/api-client';
import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';

const STORAGE_KEY = 'about-time:templates';

/**
 * Load templates from API with localStorage cache fallback
 */
export const loadTemplates = async (): Promise<TemplateMap> => {
  try {
    // Try API first
    const templates = await fetchTemplateMap();
    // Cache in localStorage
    saveToLocalStorage(templates);
    return templates;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load templates from API, using localStorage cache:', error);
    // Fallback to localStorage
    return loadFromLocalStorage();
  }
};

/**
 * Create template via API with optimistic localStorage update
 */
export const createTemplate = async (template: Template): Promise<Template> => {
  try {
    const created = await apiCreateTemplate(template);
    return created;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create template via API:', error);
    throw error;
  }
};

/**
 * Update template via API
 */
export const updateTemplate = async (template: Template): Promise<Template> => {
  try {
    const updated = await apiUpdateTemplate(template);
    return updated;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update template via API:', error);
    throw error;
  }
};

/**
 * Delete template via API
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    await apiDeleteTemplate(templateId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to delete template via API:', error);
    throw error;
  }
};

/**
 * Load templates from localStorage (used as cache/fallback)
 */
const loadFromLocalStorage = (): TemplateMap => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as TemplateMap;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load templates from localStorage:', error);
    return {};
  }
};

/**
 * Save templates to localStorage (used as cache)
 */
export const saveToLocalStorage = (templates: TemplateMap): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save templates to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Please delete some templates.');
    }
  }
};
