/**
 * Sync queue for offline write operations
 */

const DB_NAME = 'about-time-cache';
const SYNC_QUEUE_STORE = 'sync_queue';

export interface SyncQueueItem {
  id?: number;
  type: 'template' | 'schedule' | 'execute';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  retries: number;
}

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = (): void => reject(request.error);
    request.onsuccess = (): void => resolve(request.result);
  });
};

/**
 * Add item to sync queue
 */
export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id'>): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};

/**
 * Get all items from sync queue
 */
export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const db = await openDB();
  const transaction = db.transaction(SYNC_QUEUE_STORE, 'readonly');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = (): void => resolve(request.result);
    request.onerror = (): void => reject(request.error);
  });
};

/**
 * Remove item from sync queue
 */
export const removeFromSyncQueue = async (id: number): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};

/**
 * Update retry count for an item
 */
export const updateRetryCount = async (id: number, retries: number): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = (): void => {
      const item = getRequest.result;
      if (item) {
        item.retries = retries;
        const updateRequest = store.put(item);
        updateRequest.onsuccess = (): void => resolve(undefined);
        updateRequest.onerror = (): void => reject(updateRequest.error);
      } else {
        resolve(undefined);
      }
    };
    getRequest.onerror = (): void => reject(getRequest.error);
  });
};

/**
 * Clear entire sync queue
 */
export const clearSyncQueue = async (): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = (): void => resolve(undefined);
    request.onerror = (): void => reject(request.error);
  });
};

/**
 * Get sync queue size
 */
export const getSyncQueueSize = async (): Promise<number> => {
  const db = await openDB();
  const transaction = db.transaction(SYNC_QUEUE_STORE, 'readonly');
  const store = transaction.objectStore(SYNC_QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = (): void => resolve(request.result);
    request.onerror = (): void => reject(request.error);
  });
};
