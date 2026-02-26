const EXECUTE_COMPLETED_KEY = 'about-time:execute-completed';
const EXECUTE_SKIPPED_KEY = 'about-time:execute-skipped';
const EXECUTE_LAST_DATE_KEY = 'about-time:execute-last-date';

export function loadTodayCompleted(todayKey: string): Set<string> {
  try {
    const lastDate = localStorage.getItem(EXECUTE_LAST_DATE_KEY);
    if (lastDate !== todayKey) {
      clearDailyData();
      return new Set<string>();
    }

    const stored = localStorage.getItem(EXECUTE_COMPLETED_KEY);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (error) {
    console.error('Failed to load completed meals:', error);
  }
  return new Set<string>();
}

export function saveTodayCompleted(completedMealIds: Set<string>, todayKey: string): void {
  try {
    localStorage.setItem(EXECUTE_COMPLETED_KEY, JSON.stringify([...completedMealIds]));
    localStorage.setItem(EXECUTE_LAST_DATE_KEY, todayKey);
  } catch (error) {
    console.error('Failed to save completed meals:', error);
  }
}

export function loadTodaySkipped(todayKey: string): Set<string> {
  try {
    const lastDate = localStorage.getItem(EXECUTE_LAST_DATE_KEY);
    if (lastDate !== todayKey) return new Set<string>();

    const stored = localStorage.getItem(EXECUTE_SKIPPED_KEY);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (error) {
    console.error('Failed to load skipped meals:', error);
  }
  return new Set<string>();
}

export function saveTodaySkipped(skippedMealIds: Set<string>, todayKey: string): void {
  try {
    localStorage.setItem(EXECUTE_SKIPPED_KEY, JSON.stringify([...skippedMealIds]));
    localStorage.setItem(EXECUTE_LAST_DATE_KEY, todayKey);
  } catch (error) {
    console.error('Failed to save skipped meals:', error);
  }
}

function clearDailyData(): void {
  localStorage.removeItem(EXECUTE_COMPLETED_KEY);
  localStorage.removeItem(EXECUTE_SKIPPED_KEY);
}
