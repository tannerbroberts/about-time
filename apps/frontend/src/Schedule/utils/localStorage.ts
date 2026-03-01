import {
  getLanes as apiGetLanes,
  setLane as apiSetLane,
  removeLane as apiRemoveLane,
  getGoals as apiGetGoals,
  setGoals as apiSetGoals,
} from '@about-time/api-client';

// Storage keys for cache
const SCHEDULE_LANES_KEY = 'about-time:schedule-lanes';
const DAILY_GOALS_KEY = 'about-time:daily-goals';

/**
 * Load schedule lanes from API with localStorage cache fallback
 * @deprecated This function fetches a large date range (±1 year) and is being replaced by
 * view-based fetching via scheduleCacheManager. New code should use scheduleCacheManager.fetchForRange()
 * instead. This function is kept for backward compatibility during the initial mount.
 */
export const loadScheduleLanes = async (): Promise<Record<string, string>> => {
  try {
    // Get lanes for the past year to current + 1 year
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
    const endDate = new Date(now);
    endDate.setFullYear(now.getFullYear() + 1);

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const lanes = await apiGetLanes(start, end);
    // Cache in localStorage
    saveScheduleLanesToCache(lanes);
    return lanes;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load schedule lanes from API, using localStorage cache:', error);
    return loadScheduleLanesFromCache();
  }
};

/**
 * Set lane for a specific date
 */
export const setScheduleLane = async (dateKey: string, laneTemplateId: string): Promise<void> => {
  try {
    await apiSetLane(dateKey, laneTemplateId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to set schedule lane via API:', error);
    throw error;
  }
};

/**
 * Remove lane assignment
 */
export const removeScheduleLane = async (dateKey: string): Promise<void> => {
  try {
    await apiRemoveLane(dateKey);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to remove schedule lane via API:', error);
    throw error;
  }
};

/**
 * Load daily goals from API with localStorage cache fallback
 */
export const loadDailyGoals = async (): Promise<{
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
} | null> => {
  try {
    const goals = await apiGetGoals();
    // Cache in localStorage
    saveDailyGoalsToCache(goals);
    return goals;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load daily goals from API, using localStorage cache:', error);
    return loadDailyGoalsFromCache();
  }
};

/**
 * Update daily goals
 */
export const updateDailyGoals = async (goals: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}): Promise<void> => {
  try {
    await apiSetGoals(goals);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update daily goals via API:', error);
    throw error;
  }
};

// Cache functions
const loadScheduleLanesFromCache = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(SCHEDULE_LANES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load schedule lanes from localStorage:', error);
    return {};
  }
};

export const saveScheduleLanesToCache = (lanes: Record<string, string>): void => {
  try {
    localStorage.setItem(SCHEDULE_LANES_KEY, JSON.stringify(lanes));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save schedule lanes to localStorage:', error);
  }
};

const loadDailyGoalsFromCache = (): {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
} | null => {
  try {
    const stored = localStorage.getItem(DAILY_GOALS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load daily goals from localStorage:', error);
    return null;
  }
};

const saveDailyGoalsToCache = (goals: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}): void => {
  try {
    localStorage.setItem(DAILY_GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save daily goals to localStorage:', error);
  }
};
