import type { ScheduledMeal } from '../reducer';

export type TrajectoryStatus = 'on-track' | 'ahead' | 'behind';

export interface TrajectoryResult {
  status: TrajectoryStatus;
  color: 'success' | 'warning' | 'error';
  percentOfGoal: number;
  expectedPercentAtThisTime: number;
}

export function calculateTrajectory(
  consumed: number,
  goal: number,
  currentTime: Date,
  scheduledMeals: ScheduledMeal[],
): TrajectoryResult {
  const percentOfDay = getPercentOfSchedulePassed(currentTime, scheduledMeals);
  const expectedPercentAtThisTime = percentOfDay;
  const percentOfGoal = goal > 0 ? (consumed / goal) * 100 : 0;

  const deviation = Math.abs(percentOfGoal - expectedPercentAtThisTime);

  let status: TrajectoryStatus;
  let color: 'success' | 'warning' | 'error';

  if (deviation <= 10) {
    status = 'on-track';
    color = 'success';
  } else if (deviation <= 20) {
    status = percentOfGoal > expectedPercentAtThisTime ? 'ahead' : 'behind';
    color = 'warning';
  } else {
    status = percentOfGoal > expectedPercentAtThisTime ? 'ahead' : 'behind';
    color = 'error';
  }

  return {
    status,
    color,
    percentOfGoal,
    expectedPercentAtThisTime,
  };
}

function getPercentOfSchedulePassed(currentTime: Date, scheduledMeals: ScheduledMeal[]): number {
  if (scheduledMeals.length === 0) return 0;

  const firstMealTime = scheduledMeals[0].time.getTime();
  const lastMealTime = scheduledMeals[scheduledMeals.length - 1].time.getTime();
  const currentTimeMs = currentTime.getTime();

  if (currentTimeMs <= firstMealTime) return 0;
  if (currentTimeMs >= lastMealTime) return 100;

  const totalDuration = lastMealTime - firstMealTime;
  const elapsedDuration = currentTimeMs - firstMealTime;

  return (elapsedDuration / totalDuration) * 100;
}
