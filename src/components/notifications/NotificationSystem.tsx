import { useEffect, useState } from 'react';
import { Snackbar, Alert, AlertTitle, Button } from '@mui/material';
import { useItemInstances } from '../../hooks/useItemInstances';
import { useAppState } from '../../reducerContexts/App';
import { getItemById } from '../../functions/utils/item/utils';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHideDuration?: number;
}

export default function NotificationSystem() {
  const { accountingInstances } = useItemInstances();
  const { items } = useAppState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  // Check for overdue items
  useEffect(() => {
    const now = Date.now();
    const overdueInstances = accountingInstances.filter(instance => {
      const item = getItemById(items, instance.itemId);
      if (!item) return false;

      const expectedEndTime = instance.scheduledStartTime + item.duration;
      return now > expectedEndTime + (24 * 60 * 60 * 1000); // 1 day grace period
    });

    if (overdueInstances.length > 0) {
      const notification: Notification = {
        id: 'overdue-items',
        type: 'warning',
        title: 'Overdue Items',
        message: `You have ${overdueInstances.length} items that are significantly overdue.`,
        action: {
          label: 'Review',
          onClick: () => {
            // Navigate to accounting view with overdue filter
            window.location.hash = '#/accounting?filter=overdue';
          }
        },
        autoHideDuration: 10000
      };

      setNotifications(prev => {
        const existing = prev.find(n => n.id === notification.id);
        if (!existing) {
          return [...prev, notification];
        }
        return prev;
      });
    }
  }, [accountingInstances, items]);

  // Process notification queue
  useEffect(() => {
    if (!currentNotification && notifications.length > 0) {
      setCurrentNotification(notifications[0]);
    }
  }, [currentNotification, notifications]);

  const handleClose = () => {
    setCurrentNotification(null);
    setNotifications(prev => prev.slice(1));
  };

  const handleAction = () => {
    if (currentNotification?.action) {
      currentNotification.action.onClick();
    }
    handleClose();
  };

  if (!currentNotification) return null;

  return (
    <Snackbar
      open={Boolean(currentNotification)}
      autoHideDuration={currentNotification.autoHideDuration || 6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={currentNotification.type}
        onClose={handleClose}
        action={
          currentNotification.action && (
            <Button color="inherit" size="small" onClick={handleAction}>
              {currentNotification.action.label}
            </Button>
          )
        }
      >
        {currentNotification.title && (
          <AlertTitle>{currentNotification.title}</AlertTitle>
        )}
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
}
