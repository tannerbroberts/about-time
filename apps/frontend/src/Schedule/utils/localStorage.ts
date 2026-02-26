import type { DailyGoals } from '../reducer';

const SCHEDULE_LANES_KEY = 'about-time:schedule-lanes';
const DAILY_GOALS_KEY = 'about-time:daily-goals';

export function loadScheduleLanes(): Record<string, string> {
  try {
    const stored = localStorage.getItem(SCHEDULE_LANES_KEY);
    if (stored) {
      return JSON.parse(stored) as Record<string, string>;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load schedule lanes from localStorage:', error);
  }
  return {};
}

export function saveScheduleLanes(lanes: Record<string, string>): void {
  try {
    localStorage.setItem(SCHEDULE_LANES_KEY, JSON.stringify(lanes));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save schedule lanes to localStorage:', error);
  }
}

export function loadDailyGoals(): DailyGoals | null {
  try {
    const stored = localStorage.getItem(DAILY_GOALS_KEY);
    if (stored) {
      return JSON.parse(stored) as DailyGoals;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load daily goals from localStorage:', error);
  }
  return null;
}

export function saveDailyGoals(goals: DailyGoals): void {
  try {
    localStorage.setItem(DAILY_GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save daily goals to localStorage:', error);
  }
}
