import templatesData from '../../data/templates.json';

import type { Template } from './types';

interface TemplateLibrary {
  version: string;
  templates: Template[];
}

export function useTemplatesList(): Template[] {
  // Load from the shared JSON file (bundled at build time)
  const library = templatesData as TemplateLibrary;
  return library.templates;
}
