/**
 * Background sync processor for queued operations
 */

import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setLane,
  removeLane,
  updateDailyState,
} from '@about-time/api-client';
import type { Template } from '@tannerbroberts/about-time-core';

import { getSyncQueue, removeFromSyncQueue, updateRetryCount, type SyncQueueItem } from './syncQueue';

const MAX_RETRIES = 3;

/**
 * Process all items in the sync queue
 */
export const processSyncQueue = async (): Promise<{
  successful: number;
  failed: number;
  remaining: number;
}> => {
  const queue = await getSyncQueue();
  let successful = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await processQueueItem(item);
      await removeFromSyncQueue(item.id!);
      successful++;
    } catch (error) {
      console.error('Failed to sync item:', item, error);

      // Increment retry count
      const newRetries = item.retries + 1;

      if (newRetries >= MAX_RETRIES) {
        // Max retries reached, remove from queue
        console.error('Max retries reached, removing item:', item);
        await removeFromSyncQueue(item.id!);
        failed++;
      } else {
        // Update retry count
        await updateRetryCount(item.id!, newRetries);
      }
    }
  }

  const remaining = await getSyncQueue();

  return {
    successful,
    failed,
    remaining: remaining.length,
  };
};

/**
 * Process a single queue item
 */
const processQueueItem = async (item: SyncQueueItem): Promise<void> => {
  switch (item.type) {
    case 'template':
      await processTemplateItem(item);
      break;
    case 'schedule':
      await processScheduleItem(item);
      break;
    case 'execute':
      await processExecuteItem(item);
      break;
    default:
      throw new Error(`Unknown sync item type: ${item.type}`);
  }
};

/**
 * Process template operations
 */
const processTemplateItem = async (item: SyncQueueItem): Promise<void> => {
  const data = item.data as { template: Template };

  switch (item.operation) {
    case 'create':
      await createTemplate(data.template);
      break;
    case 'update':
      await updateTemplate(data.template);
      break;
    case 'delete':
      await deleteTemplate(data.template.id);
      break;
    default:
      throw new Error(`Unknown template operation: ${item.operation}`);
  }
};

/**
 * Process schedule operations
 */
const processScheduleItem = async (item: SyncQueueItem): Promise<void> => {
  const data = item.data as { dateKey: string; laneTemplateId?: string };

  switch (item.operation) {
    case 'create':
    case 'update':
      if (!data.laneTemplateId) {
        throw new Error('Missing laneTemplateId for schedule operation');
      }
      await setLane(data.dateKey, data.laneTemplateId);
      break;
    case 'delete':
      await removeLane(data.dateKey);
      break;
    default:
      throw new Error(`Unknown schedule operation: ${item.operation}`);
  }
};

/**
 * Process execute operations
 */
const processExecuteItem = async (item: SyncQueueItem): Promise<void> => {
  const data = item.data as {
    dateKey: string;
    completedMealIds: string[];
    skippedMealIds: string[];
  };

  switch (item.operation) {
    case 'update':
      await updateDailyState(data.dateKey, data.completedMealIds, data.skippedMealIds);
      break;
    default:
      throw new Error(`Unknown execute operation: ${item.operation}`);
  }
};

/**
 * Check if there are items in the sync queue
 */
export const hasPendingSyncs = async (): Promise<boolean> => {
  const queue = await getSyncQueue();
  return queue.length > 0;
};
