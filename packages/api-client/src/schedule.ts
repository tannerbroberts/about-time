/**
 * Schedule API endpoints
 */

import { apiClient } from './client.js';
import { queueScheduleLane, queueScheduleLaneRemove } from './offlineQueue.js';
import type { DailyGoals } from '@about-time/types';

/**
 * Get schedule lanes for date range
 */
export const getLanes = async (
  startDate: string,
  endDate: string
): Promise<Record<string, string>> => {
  const response = await apiClient.get<{ success: true; data: Record<string, string> }>(
    `/schedule/lanes?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data.data;
};

/**
 * Set lane for specific date (with offline queueing)
 */
export const setLane = async (
  dateKey: string,
  laneTemplateId: string
): Promise<void> => {
  await queueScheduleLane(
    async () => {
      await apiClient.put(`/schedule/lanes/${dateKey}`, { laneTemplateId });
    },
    dateKey,
    laneTemplateId
  );
};

/**
 * Remove lane assignment for date (with offline queueing)
 */
export const removeLane = async (dateKey: string): Promise<void> => {
  await queueScheduleLaneRemove(
    async () => {
      await apiClient.delete(`/schedule/lanes/${dateKey}`);
    },
    dateKey
  );
};

/**
 * Get daily nutrition goals
 */
export const getGoals = async (): Promise<DailyGoals> => {
  const response = await apiClient.get<{ success: true; data: DailyGoals }>(
    '/schedule/goals'
  );
  return response.data.data;
};

/**
 * Update daily nutrition goals
 */
export const setGoals = async (goals: DailyGoals): Promise<void> => {
  await apiClient.put('/schedule/goals', goals);
};
