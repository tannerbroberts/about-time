import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import React, { useEffect } from 'react';

import { useBuildStore } from './store';

export function NotificationManager(): React.ReactElement {
  const notifications = useBuildStore((state) => state.notifications);
  const dismissNotification = useBuildStore((state) => state.dismissNotification);

  const currentNotification = notifications[0]; // Show first in queue

  useEffect(() => {
    if (currentNotification && currentNotification.duration) {
      const timer = setTimeout(() => {
        dismissNotification(currentNotification.id);
      }, currentNotification.duration);
      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [currentNotification, dismissNotification]);

  if (!currentNotification) return <></>;

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: 72 }}
    >
      <Alert
        severity={currentNotification.severity}
        onClose={(): void => dismissNotification(currentNotification.id)}
        action={currentNotification.action}
      >
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
}
