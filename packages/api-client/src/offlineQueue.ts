/**
 * Offline queueing wrapper for API operations
 * Queues write operations when offline for later sync
 */

import type { Template } from '@tannerbroberts/about-time-core';

import { isOnline } from './client';

// Type for queued operations
export interface QueuedOperation {
  type: 'template' | 'schedule' | 'execute';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
}

export interface SyncQueueItem {
  type: 'template' | 'schedule' | 'execute';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  retries: number;
}

// Global registry for sync queue handler (set by frontend)
let syncQueueHandler: ((item: SyncQueueItem) => Promise<void>) | null = null;

/**
 * Register sync queue handler
 * Call this from frontend initialization to enable offline queueing
 */
export const registerSyncQueueHandler = (
  handler: (item: SyncQueueItem) => Promise<void>
): void => {
  syncQueueHandler = handler;
  console.log('[API] Sync queue handler registered');
};

/**
 * Execute an API operation with offline queueing support
 * If offline, queues the operation and returns success
 * If online, executes the operation normally
 */
export const withOfflineQueue = async <T>(
  apiCall: () => Promise<T>,
  queueItem: QueuedOperation
): Promise<T | void> => {
  // If online, execute normally
  if (isOnline()) {
    return apiCall();
  }

  // If offline, queue the operation
  if (!syncQueueHandler) {
    console.warn('[API] Offline but no sync queue handler registered');
    throw new Error('Offline and sync queue not available');
  }

  try {
    await syncQueueHandler({
      type: queueItem.type,
      operation: queueItem.operation,
      data: queueItem.data,
      timestamp: Date.now(),
      retries: 0,
    });

    console.log('[API] Operation queued for sync:', queueItem);

    // Return void to indicate queued (not executed)
    return undefined;
  } catch (error) {
    console.error('[API] Failed to queue operation:', error);
    throw new Error('Offline and unable to queue operation');
  }
};

/**
 * Type-safe queueing helpers for specific operations
 */

export const queueTemplateCreate = async (
  apiCall: () => Promise<Template>,
  template: Template
): Promise<Template | void> => {
  return withOfflineQueue(apiCall, {
    type: 'template',
    operation: 'create',
    data: { template },
  });
};

export const queueTemplateUpdate = async (
  apiCall: () => Promise<Template>,
  template: Template
): Promise<Template | void> => {
  return withOfflineQueue(apiCall, {
    type: 'template',
    operation: 'update',
    data: { template },
  });
};

export const queueTemplateDelete = async (
  apiCall: () => Promise<void>,
  templateId: string
): Promise<void> => {
  return withOfflineQueue(apiCall, {
    type: 'template',
    operation: 'delete',
    data: { template: { id: templateId } },
  });
};

export const queueScheduleLane = async (
  apiCall: () => Promise<void>,
  dateKey: string,
  laneTemplateId: string
): Promise<void> => {
  return withOfflineQueue(apiCall, {
    type: 'schedule',
    operation: 'update',
    data: { dateKey, laneTemplateId },
  });
};

export const queueScheduleLaneRemove = async (
  apiCall: () => Promise<void>,
  dateKey: string
): Promise<void> => {
  return withOfflineQueue(apiCall, {
    type: 'schedule',
    operation: 'delete',
    data: { dateKey },
  });
};

export const queueDailyState = async (
  apiCall: () => Promise<void>,
  dateKey: string,
  completedMealIds: string[],
  skippedMealIds: string[]
): Promise<void> => {
  return withOfflineQueue(apiCall, {
    type: 'execute',
    operation: 'update',
    data: { dateKey, completedMealIds, skippedMealIds },
  });
};
