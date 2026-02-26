/**
 * MigrationBanner component - Shows banner to migrate localStorage data
 */

import { migrateData, checkMigrationStatus } from '@about-time/api-client';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorIcon from '@mui/icons-material/Error';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useState, useEffect } from 'react';

import {
  hasLocalStorageData,
  exportLocalStorageData,
  clearLocalStorageData,
  getMigrationSummary,
} from './localStorage';

export const MigrationBanner = (): React.JSX.Element | null => {
  const [show, setShow] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Helper functions to avoid nested ternaries
  const getSeverity = (): 'success' | 'error' | 'info' => {
    if (success) return 'success';
    if (error) return 'error';
    return 'info';
  };

  const getIcon = (): React.JSX.Element => {
    if (success) return <CheckCircleIcon />;
    if (error) return <ErrorIcon />;
    return <CloudUploadIcon />;
  };

  const getTitle = (): string => {
    if (success) return 'Migration Complete!';
    if (error) return 'Migration Failed';
    return 'Sync Your Local Data to the Cloud';
  };

  const renderContent = (): React.JSX.Element => {
    if (success) {
      return (
        <Typography variant="body2">
          Your data has been successfully migrated to the cloud. You can now access it from any
          device!
        </Typography>
      );
    }

    if (error) {
      return (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      );
    }

    return (
      <>
        <Typography variant="body2" sx={{ mb: 1 }}>
          We found {totalItems} item{totalItems !== 1 ? 's' : ''} in your browser that can be
          synced to your account:
        </Typography>

        <List dense sx={{ pl: 2 }}>
          {summary.templates > 0 && (
            <ListItem disablePadding>
              <ListItemText
                primary={`${summary.templates} template${summary.templates !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {summary.scheduleLanes > 0 && (
            <ListItem disablePadding>
              <ListItemText
                primary={`${summary.scheduleLanes} scheduled day${summary.scheduleLanes !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {summary.dailyGoals && (
            <ListItem disablePadding>
              <ListItemText primary="Daily nutrition goals" />
            </ListItem>
          )}
          {summary.dailyStates > 0 && (
            <ListItem disablePadding>
              <ListItemText
                primary={`${summary.dailyStates} day${summary.dailyStates !== 1 ? 's' : ''} of meal tracking`}
              />
            </ListItem>
          )}
        </List>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleMigrate}
            disabled={migrating}
            startIcon={migrating ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          >
            {migrating ? 'Migrating...' : 'Migrate Now'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDismiss}
            disabled={migrating}
          >
            Later
          </Button>
        </Box>
      </>
    );
  };

  useEffect(() => {
    const checkMigration = async (): Promise<void> => {
      try {
        // Check if user has localStorage data
        const hasLocalData = hasLocalStorageData();
        if (!hasLocalData) {
          return;
        }

        // Check if user has already migrated to backend
        const { hasData } = await checkMigrationStatus();

        // Show banner if has local data but not in backend
        if (hasLocalData && !hasData) {
          setShow(true);
        }
      } catch (err) {
        console.error('Failed to check migration status:', err);
      }
    };

    // Check on mount
    checkMigration();
  }, []);

  const handleMigrate = async (): Promise<void> => {
    setMigrating(true);
    setError(null);

    try {
      // Export localStorage data
      const data = exportLocalStorageData();

      // Migrate to backend
      const results = await migrateData(data);

      // Check if migration was successful
      const hasFailures = results.templates.failed > 0
        || results.scheduleLanes.failed > 0
        || results.dailyStates.failed > 0;

      if (hasFailures) {
        setError(
          `Migration completed with some failures: ${results.templates.failed} templates, `
          + `${results.scheduleLanes.failed} schedule lanes, ${results.dailyStates.failed} daily states failed.`,
        );
      } else {
        // Clear localStorage after successful migration
        clearLocalStorageData();
        setSuccess(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShow(false);
        }, 5000);
      }
    } catch (err) {
      console.error('Migration failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to migrate data. Please try again or contact support.',
      );
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
    setShow(false);
  };

  // Don't show if dismissed or migration complete
  if (!show || dismissed) {
    return null;
  }

  const summary = getMigrationSummary();
  const totalItems = summary.templates
    + summary.scheduleLanes
    + (summary.dailyGoals ? 1 : 0)
    + summary.dailyStates;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1300,
        width: '90%',
        maxWidth: 600,
      }}
    >
      <Collapse in={show}>
        <Alert
          severity={getSeverity()}
          icon={getIcon()}
          action={(
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismiss}
              disabled={migrating}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )}
          sx={{ boxShadow: 3 }}
        >
          <AlertTitle>
            {getTitle()}
          </AlertTitle>

          {renderContent()}
        </Alert>
      </Collapse>
    </Box>
  );
};
