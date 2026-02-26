/**
 * OnlineStatus component - Shows online/offline status with sync queue indicator
 */

import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import { Box, Chip, Tooltip } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import { hasPendingSyncs } from '../sync/syncProcessor';

export const OnlineStatus = (): React.JSX.Element | null => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingItems, setHasPendingItems] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkPendingSyncs = useCallback(async (): Promise<void> => {
    try {
      const pending = await hasPendingSyncs();
      setHasPendingItems(pending);

      // If online and has pending items, trigger background sync
      if (navigator.onLine && pending && !isSyncing) {
        setIsSyncing(true);
        // Import dynamically to avoid circular dependencies
        const { requestBackgroundSync } = await import('../sync/registerSW');
        await requestBackgroundSync();
        setIsSyncing(false);
        // Re-check after sync
        setTimeout(() => checkPendingSyncs(), 1000);
      }
    } catch (error) {
      console.error('Failed to check pending syncs:', error);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      // When coming online, check for pending syncs and trigger sync
      checkPendingSyncs();
    };

    const handleOffline = (): void => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkPendingSyncs();

    // Periodic check for pending items
    const interval = setInterval(() => {
      checkPendingSyncs();
    }, 5000);

    return (): void => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkPendingSyncs]);

  // Only show status indicator if offline or has pending items
  if (isOnline && !hasPendingItems) {
    return null;
  }

  const getStatusText = (): string => {
    if (!isOnline) {
      return hasPendingItems ? 'Offline - Changes queued' : 'Offline';
    }
    if (isSyncing) {
      return 'Syncing...';
    }
    if (hasPendingItems) {
      return 'Pending changes';
    }
    return 'Online';
  };

  const getIcon = (): React.JSX.Element => {
    if (isSyncing) {
      return <SyncIcon sx={{ animation: 'spin 1s linear infinite' }} />;
    }
    return isOnline ? <CloudDoneIcon /> : <CloudOffIcon />;
  };

  const getColor = (): 'default' | 'warning' | 'error' | 'success' => {
    if (isSyncing) {
      return 'default';
    }
    if (!isOnline) {
      return 'error';
    }
    if (hasPendingItems) {
      return 'warning';
    }
    return 'success';
  };

  const getTooltip = (): string => {
    if (!isOnline) {
      return 'You are offline. Changes will be saved locally and synced when you reconnect.';
    }
    if (isSyncing) {
      return 'Syncing your changes to the server...';
    }
    if (hasPendingItems) {
      return 'You have changes waiting to sync. They will be uploaded automatically.';
    }
    return 'All changes synced';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Tooltip title={getTooltip()} arrow>
        <Chip
          icon={getIcon()}
          label={getStatusText()}
          color={getColor()}
          size="small"
          sx={{
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
            boxShadow: 2,
          }}
        />
      </Tooltip>
    </Box>
  );
};
