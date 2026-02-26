/**
 * Service Worker registration
 */

import { processSyncQueue } from './syncProcessor';

/**
 * Register the service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');

            // Optionally prompt user to refresh
            if (confirm('New version available! Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_QUEUE') {
        console.log('Service worker requested sync queue processing');
        processSyncQueue().then((result) => {
          console.log('Sync queue processed:', result);
        });
      }
    });

    // Register background sync if supported
    if ('sync' in registration) {
      console.log('Background Sync supported');
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister service worker (for development/testing)
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('Service Worker unregistered');
  }
};

/**
 * Request background sync
 */
export const requestBackgroundSync = async (tag: string = 'sync-queue'): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('Background Sync not supported, processing queue immediately');
    await processSyncQueue();
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
  } catch (error) {
    console.error('Background sync registration failed:', error);
    // Fallback to immediate sync
    await processSyncQueue();
  }
};
