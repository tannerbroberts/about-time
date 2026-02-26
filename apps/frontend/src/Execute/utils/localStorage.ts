import {
  getDailyState as apiGetDailyState,
  updateDailyState as apiUpdateDailyState,
  completeMeal as apiCompleteMeal,
  skipMeal as apiSkipMeal,
} from '@about-time/api-client';

const DAILY_STATE_KEY = 'about-time:daily-state';

export interface DailyState {
  completedMealIds: string[];
  skippedMealIds: string[];
}

/**
 * Load daily state from API with localStorage cache fallback
 */
export const loadDailyState = async (dateKey: string): Promise<DailyState> => {
  try {
    const state = await apiGetDailyState(dateKey);
    // Cache in localStorage
    saveDailyStateToCache(dateKey, state);
    return {
      completedMealIds: state.completedMealIds,
      skippedMealIds: state.skippedMealIds,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load daily state from API, using localStorage cache:', error);
    return loadDailyStateFromCache(dateKey);
  }
};

/**
 * Complete a meal
 */
export const completeMeal = async (dateKey: string, mealId: string): Promise<void> => {
  try {
    await apiCompleteMeal(dateKey, mealId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to complete meal via API:', error);
    throw error;
  }
};

/**
 * Skip a meal
 */
export const skipMeal = async (dateKey: string, mealId: string): Promise<void> => {
  try {
    await apiSkipMeal(dateKey, mealId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to skip meal via API:', error);
    throw error;
  }
};

/**
 * Update full daily state
 */
export const updateDailyState = async (
  dateKey: string,
  completedMealIds: string[],
  skippedMealIds: string[],
): Promise<void> => {
  try {
    await apiUpdateDailyState(dateKey, completedMealIds, skippedMealIds);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update daily state via API:', error);
    throw error;
  }
};

// Cache functions
const loadDailyStateFromCache = (dateKey: string): DailyState => {
  try {
    const stored = localStorage.getItem(`${DAILY_STATE_KEY}:${dateKey}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load daily state from localStorage:', error);
  }
  return { completedMealIds: [], skippedMealIds: [] };
};

export const saveDailyStateToCache = (
  dateKey: string,
  state: { completedMealIds: string[]; skippedMealIds: string[] },
): void => {
  try {
    localStorage.setItem(`${DAILY_STATE_KEY}:${dateKey}`, JSON.stringify(state));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save daily state to localStorage:', error);
  }
};
