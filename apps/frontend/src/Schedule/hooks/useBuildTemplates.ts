import type { TemplateMap } from '@tannerbroberts/about-time-core';

import { useBuildStore } from '../../Build/store';

/**
 * Stable Zustand selector for build templates.
 * Prevents unnecessary re-renders by comparing template references instead of creating new objects.
 */
export function useBuildTemplates(): TemplateMap {
  return useBuildStore((state) => state.templates);
}
