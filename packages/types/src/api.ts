/**
 * API request/response types
 */

import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';
import type { User } from './auth.js';

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: true;
}

export interface ApiError {
  error: string;
  message: string;
  success: false;
}

// ============================================================================
// Template API Types
// ============================================================================

export interface TemplateListQuery {
  offset?: number;
  limit?: number;
  templateType?: 'busy' | 'lane';
  searchIntent?: string;
  sortBy?: 'updatedAt' | 'createdAt' | 'intent';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  offset: number;
  limit: number;
}

export interface CreateTemplateRequest {
  template: Template;
}

export interface UpdateTemplateRequest {
  template: Template;
}

export interface TemplateHierarchyResponse {
  template: Template;
  children: Template[];
  relationships: Array<{
    relationshipId: string;
    childTemplateId: string;
    offset: number;
  }>;
}

// ============================================================================
// Schedule API Types
// ============================================================================

export interface ScheduleLanesQuery {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
}

export interface ScheduleLanesResponse {
  lanes: Record<string, string>; // dateKey -> laneTemplateId
}

export interface SetScheduleLaneRequest {
  laneTemplateId: string;
}

export interface DailyGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface UpdateDailyGoalsRequest extends DailyGoals {}

// ============================================================================
// Execute API Types
// ============================================================================

export interface DailyStateResponse {
  dateKey: string;
  completedMealIds: string[];
  skippedMealIds: string[];
  updatedAt: Date;
}

export interface UpdateDailyStateRequest {
  completedMealIds: string[];
  skippedMealIds: string[];
}

export interface CompleteMealRequest {
  mealId: string;
}

export interface SkipMealRequest {
  mealId: string;
}

// ============================================================================
// Sync API Types (for offline support)
// ============================================================================

export interface SyncRequest {
  templates?: Template[];
  scheduleLanes?: Record<string, string>;
  dailyGoals?: DailyGoals;
  dailyStates?: Record<string, { completedMealIds: string[]; skippedMealIds: string[] }>;
}

export interface SyncResponse {
  success: true;
  conflicts: Array<{
    type: 'template' | 'schedule' | 'execute';
    id: string;
    serverVersion: unknown;
    clientVersion: unknown;
  }>;
}

export interface ConflictCheckRequest {
  templateIds?: string[];
  dateKeys?: string[];
}

export interface ConflictCheckResponse {
  conflicts: Array<{
    type: 'template' | 'schedule' | 'execute';
    id: string;
    lastModified: Date;
  }>;
}

// ============================================================================
// Migration API Types
// ============================================================================

export interface MigrateLocalStorageRequest {
  templates: TemplateMap;
  scheduleLanes: Record<string, string>;
  dailyGoals: DailyGoals;
}

export interface MigrateLocalStorageResponse {
  success: true;
  imported: {
    templates: number;
    scheduleLanes: number;
    dailyGoals: boolean;
  };
}
