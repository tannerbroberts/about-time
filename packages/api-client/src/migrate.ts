/**
 * Migration API endpoints
 */

import type { TemplateMap } from '@tannerbroberts/about-time-core';
import type { DailyGoals } from '@about-time/types';

import { apiClient } from './client.js';

export interface DailyStateData {
  dateKey: string;
  completedMealIds: string[];
  skippedMealIds: string[];
}

export interface MigrationData {
  templates?: TemplateMap;
  scheduleLanes?: Record<string, string>;
  dailyGoals?: DailyGoals;
  dailyStates?: DailyStateData[];
}

export interface MigrationResults {
  templates: { imported: number; failed: number };
  scheduleLanes: { imported: number; failed: number };
  dailyGoals: { imported: boolean };
  dailyStates: { imported: number; failed: number };
}

/**
 * Batch import localStorage data
 */
export const migrateData = async (data: MigrationData): Promise<MigrationResults> => {
  const response = await apiClient.post<{ success: true; data: MigrationResults }>(
    '/migrate',
    data
  );
  return response.data.data;
};

/**
 * Check if user has existing data in backend
 */
export const checkMigrationStatus = async (): Promise<{ hasData: boolean }> => {
  const response = await apiClient.get<{ success: true; data: { hasData: boolean } }>(
    '/migrate/check'
  );
  return response.data.data;
};
