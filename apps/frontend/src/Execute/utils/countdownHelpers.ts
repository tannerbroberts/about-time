import type { ScheduledMeal } from '../reducer';

export function getNextScheduledMeal(
  scheduledMeals: ScheduledMeal[],
  currentTime: Date,
): ScheduledMeal | null {
  for (const meal of scheduledMeals) {
    if (!meal.completed && !meal.skipped && meal.time > currentTime) {
      return meal;
    }
  }
  return null;
}

export function getTimeUntilMeal(meal: ScheduledMeal, currentTime: Date): number {
  return meal.time.getTime() - currentTime.getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Time to eat!';

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
