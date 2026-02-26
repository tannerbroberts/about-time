/**
 * IndexedDB utilities for offline storage
 */

import type { Template, TemplateMap } from '@tannerbroberts/about-time-core';

const DB_NAME = 'about-time-cache';
const DB_VERSION = 1;

// Store names
const STORES = {
  TEMPLATES: 'templates',
  SCHEDULE_LANES: 'schedule_lanes',
  DAILY_STATE: 'daily_state',
  DAILY_GOALS: 'daily_goals',
  SYNC_QUEUE: 'sync_queue',
} as const;

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (): void => reject(request.error);
    request.onsuccess = (): void => resolve(request.result);

    request.onupgradeneeded = (event): void => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Templates store
      if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
        db.createObjectStore(STORES.TEMPLATES, { keyPath: 'id' });
      }

      // Schedule lanes store (key: dateKey)
      if (!db.objectStoreNames.contains(STORES.SCHEDULE_LANES)) {
        db.createObjectStore(STORES.SCHEDULE_LANES, { keyPath: 'dateKey' });
      }

      // Daily state store (key: dateKey)
      if (!db.objectStoreNames.contains(STORES.DAILY_STATE)) {
        db.createObjectStore(STORES.DAILY_STATE, { keyPath: 'dateKey' });
      }

      // Daily goals store (single record)
      if (!db.objectStoreNames.contains(STORES.DAILY_GOALS)) {
        db.createObjectStore(STORES.DAILY_GOALS, { keyPath: 'id' });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// ============================================================================
// Templates
// ============================================================================

export const getTemplates = async (): Promise<TemplateMap> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.TEMPLATES, 'readonly');
  const store = transaction.objectStore(STORES.TEMPLATES);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = (): void => {
      const templates: Template[] = request.result;
      const map: TemplateMap = {};
      for (const template of templates) {
        map[template.id] = template;
      }
      resolve(map);
    };
    request.onerror = (): void => reject(request.error);
  });
};

export const saveTemplates = async (templates: TemplateMap): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.TEMPLATES, 'readwrite');
  const store = transaction.objectStore(STORES.TEMPLATES);

  // Clear existing templates
  await new Promise((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = (): void => resolve(undefined);
    clearRequest.onerror = (): void => reject(clearRequest.error);
  });

  // Save all templates
  const templateArray = Object.values(templates);
  for (const template of templateArray) {
    await new Promise((resolve, reject) => {
      const request = store.put(template);
      request.onsuccess = (): void => resolve(undefined);
      request.onerror = (): void => reject(request.error);
    });
  }
};

// ============================================================================
// Schedule Lanes
// ============================================================================

export const getScheduleLanes = async (): Promise<Record<string, string>> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.SCHEDULE_LANES, 'readonly');
  const store = transaction.objectStore(STORES.SCHEDULE_LANES);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = (): void => {
      const lanes: Array<{ dateKey: string; laneTemplateId: string }> = request.result;
      const map: Record<string, string> = {};
      for (const lane of lanes) {
        map[lane.dateKey] = lane.laneTemplateId;
      }
      resolve(map);
    };
    request.onerror = (): void => reject(request.error);
  });
};

export const saveScheduleLane = async (dateKey: string, laneTemplateId: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.SCHEDULE_LANES, 'readwrite');
  const store = transaction.objectStore(STORES.SCHEDULE_LANES);

  return new Promise((resolve, reject) => {
    const request = store.put({ dateKey, laneTemplateId });
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};

export const deleteScheduleLane = async (dateKey: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.SCHEDULE_LANES, 'readwrite');
  const store = transaction.objectStore(STORES.SCHEDULE_LANES);

  return new Promise((resolve, reject) => {
    const request = store.delete(dateKey);
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};

// ============================================================================
// Daily State
// ============================================================================

export const getDailyState = async (dateKey: string): Promise<{
  completedMealIds: string[];
  skippedMealIds: string[];
} | null> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.DAILY_STATE, 'readonly');
  const store = transaction.objectStore(STORES.DAILY_STATE);

  return new Promise((resolve, reject) => {
    const request = store.get(dateKey);
    request.onsuccess = (): void => resolve(request.result || null);
    request.onerror = (): void => reject(request.error);
  });
};

export const saveDailyState = async (
  dateKey: string,
  completedMealIds: string[],
  skippedMealIds: string[],
): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.DAILY_STATE, 'readwrite');
  const store = transaction.objectStore(STORES.DAILY_STATE);

  return new Promise((resolve, reject) => {
    const request = store.put({ dateKey, completedMealIds, skippedMealIds });
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};

// ============================================================================
// Daily Goals
// ============================================================================

export const getDailyGoals = async (): Promise<{
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
} | null> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.DAILY_GOALS, 'readonly');
  const store = transaction.objectStore(STORES.DAILY_GOALS);

  return new Promise((resolve, reject) => {
    const request = store.get('default');
    request.onsuccess = (): void => resolve(request.result || null);
    request.onerror = (): void => reject(request.error);
  });
};

export const saveDailyGoals = async (goals: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORES.DAILY_GOALS, 'readwrite');
  const store = transaction.objectStore(STORES.DAILY_GOALS);

  return new Promise((resolve, reject) => {
    const request = store.put({ id: 'default', ...goals });
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};
