/**
 * Execute API endpoints
 */

import { apiClient } from './client.js';
import { queueDailyState } from './offlineQueue.js';
import type { DailyStateResponse } from '@about-time/types';

/**
 * Get daily state for specific date
 */
export const getDailyState = async (dateKey: string): Promise<{
  dateKey: string;
  completedMealIds: string[];
  skippedMealIds: string[];
  updatedAt: Date;
}> => {
  const response = await apiClient.get<{ success: true; data: DailyStateResponse }>(
    `/execute/daily-state/${dateKey}`
  );
  return {
    ...response.data.data,
    updatedAt: new Date(response.data.data.updatedAt),
  };
};

/**
 * Update full daily state (with offline queueing)
 */
export const updateDailyState = async (
  dateKey: string,
  completedMealIds: string[],
  skippedMealIds: string[]
): Promise<void> => {
  await queueDailyState(
    async () => {
      await apiClient.put(`/execute/daily-state/${dateKey}`, {
        completedMealIds,
        skippedMealIds,
      });
    },
    dateKey,
    completedMealIds,
    skippedMealIds
  );
};

/**
 * Mark meal as completed
 */
export const completeMeal = async (dateKey: string, mealId: string): Promise<void> => {
  await apiClient.patch(`/execute/daily-state/${dateKey}/complete`, { mealId });
};

/**
 * Mark meal as skipped
 */
export const skipMeal = async (dateKey: string, mealId: string): Promise<void> => {
  await apiClient.patch(`/execute/daily-state/${dateKey}/skip`, { mealId });
};

/**
 * Unmark meal (remove from both completed and skipped)
 */
export const unmarkMeal = async (dateKey: string, mealId: string): Promise<void> => {
  await apiClient.patch(`/execute/daily-state/${dateKey}/unmark`, { mealId });
};
