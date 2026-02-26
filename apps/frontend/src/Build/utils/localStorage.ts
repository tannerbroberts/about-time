import type { TemplateMap } from '@tannerbroberts/about-time-core';

const STORAGE_KEY = 'about-time:templates';

export const loadTemplates = (): TemplateMap => {
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

export const saveTemplates = (templates: TemplateMap): void => {
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
