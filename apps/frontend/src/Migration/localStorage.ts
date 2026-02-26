/**
 * localStorage migration utilities
 * Extracts data from localStorage for migration to backend
 */

import type { DailyStateData } from '@about-time/api-client';
import type { DailyGoals } from '@about-time/types';
import type { TemplateMap } from '@tannerbroberts/about-time-core';

// localStorage keys
const TEMPLATES_KEY = 'about-time:templates';
const SCHEDULE_LANES_KEY = 'about-time:schedule-lanes';
const DAILY_GOALS_KEY = 'about-time:daily-goals';
const DAILY_STATE_KEY_PREFIX = 'about-time:daily-state:';

/**
 * Check if localStorage has any data to migrate
 */
export const hasLocalStorageData = (): boolean => {
  try {
    return !!(
      localStorage.getItem(TEMPLATES_KEY)
      || localStorage.getItem(SCHEDULE_LANES_KEY)
      || localStorage.getItem(DAILY_GOALS_KEY)
      || getDailyStateKeys().length > 0
    );
  } catch (error) {
    console.error('Error checking localStorage:', error);
    return false;
  }
};

/**
 * Get all daily state keys from localStorage
 */
const getDailyStateKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DAILY_STATE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Extract templates from localStorage
 */
const extractTemplates = (): TemplateMap | undefined => {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (!stored) return undefined;

    const templates = JSON.parse(stored);
    // Validate it's an object
    if (typeof templates !== 'object' || templates === null) {
      console.warn('Invalid templates data in localStorage');
      return undefined;
    }

    return templates as TemplateMap;
  } catch (error) {
    console.error('Error extracting templates:', error);
    return undefined;
  }
};

/**
 * Extract schedule lanes from localStorage
 */
const extractScheduleLanes = (): Record<string, string> | undefined => {
  try {
    const stored = localStorage.getItem(SCHEDULE_LANES_KEY);
    if (!stored) return undefined;

    const lanes = JSON.parse(stored);
    // Validate it's an object
    if (typeof lanes !== 'object' || lanes === null) {
      console.warn('Invalid schedule lanes data in localStorage');
      return undefined;
    }

    return lanes as Record<string, string>;
  } catch (error) {
    console.error('Error extracting schedule lanes:', error);
    return undefined;
  }
};

/**
 * Extract daily goals from localStorage
 */
const extractDailyGoals = (): DailyGoals | undefined => {
  try {
    const stored = localStorage.getItem(DAILY_GOALS_KEY);
    if (!stored) return undefined;

    const goals = JSON.parse(stored);
    // Validate it has required fields
    if (
      typeof goals !== 'object'
      || goals === null
      || typeof goals.calories !== 'number'
      || typeof goals.protein_g !== 'number'
      || typeof goals.carbs_g !== 'number'
      || typeof goals.fats_g !== 'number'
    ) {
      console.warn('Invalid daily goals data in localStorage');
      return undefined;
    }

    // Convert snake_case to camelCase for API
    return {
      calories: goals.calories,
      proteinG: goals.protein_g,
      carbsG: goals.carbs_g,
      fatsG: goals.fats_g,
    };
  } catch (error) {
    console.error('Error extracting daily goals:', error);
    return undefined;
  }
};

/**
 * Extract daily states from localStorage
 */
const extractDailyStates = (): DailyStateData[] => {
  const states: DailyStateData[] = [];

  try {
    const keys = getDailyStateKeys();

    for (const key of keys) {
      const dateKey = key.replace(DAILY_STATE_KEY_PREFIX, '');
      const stored = localStorage.getItem(key);

      if (!stored) continue;

      try {
        const state = JSON.parse(stored);

        // Validate state structure
        if (
          typeof state !== 'object'
          || state === null
          || !Array.isArray(state.completedMealIds)
          || !Array.isArray(state.skippedMealIds)
        ) {
          console.warn(`Invalid daily state data for ${dateKey}`);
          continue;
        }

        states.push({
          dateKey,
          completedMealIds: state.completedMealIds,
          skippedMealIds: state.skippedMealIds,
        });
      } catch (error) {
        console.error(`Error parsing daily state for ${dateKey}:`, error);
      }
    }
  } catch (error) {
    console.error('Error extracting daily states:', error);
  }

  return states;
};

/**
 * Export all localStorage data for migration
 */
export const exportLocalStorageData = (): {
  templates?: TemplateMap;
  scheduleLanes?: Record<string, string>;
  dailyGoals?: DailyGoals;
  dailyStates?: DailyStateData[];
} => {
  return {
    templates: extractTemplates(),
    scheduleLanes: extractScheduleLanes(),
    dailyGoals: extractDailyGoals(),
    dailyStates: extractDailyStates(),
  };
};

/**
 * Clear all migrated data from localStorage
 */
export const clearLocalStorageData = (): void => {
  try {
    localStorage.removeItem(TEMPLATES_KEY);
    localStorage.removeItem(SCHEDULE_LANES_KEY);
    localStorage.removeItem(DAILY_GOALS_KEY);

    // Remove all daily state keys
    const keys = getDailyStateKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }

    console.log('✓ localStorage data cleared after successful migration');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Get summary of data to be migrated
 */
export const getMigrationSummary = (): {
  templates: number;
  scheduleLanes: number;
  dailyGoals: boolean;
  dailyStates: number;
} => {
  const templates = extractTemplates();
  const scheduleLanes = extractScheduleLanes();
  const dailyGoals = extractDailyGoals();
  const dailyStates = extractDailyStates();

  return {
    templates: templates ? Object.keys(templates).length : 0,
    scheduleLanes: scheduleLanes ? Object.keys(scheduleLanes).length : 0,
    dailyGoals: !!dailyGoals,
    dailyStates: dailyStates.length,
  };
};
