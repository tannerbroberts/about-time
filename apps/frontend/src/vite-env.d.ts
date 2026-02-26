/// <reference types="vite/client" />

/**
 * Type declarations for Background Sync API
 * https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
 */

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

interface ServiceWorkerGlobalScopeEventMap {
  sync: SyncEvent;
}
