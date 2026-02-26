import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';

interface EmptyStateProps {
  onCreateBusyClick: () => void;
  onCreateLaneClick: () => void;
}

export function EmptyState({ onCreateBusyClick, onCreateLaneClick }: EmptyStateProps): React.ReactElement {
  return (
    <Stack
      spacing={3}
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: '60vh',
        padding: 4,
      }}
    >
      <Typography variant="h5" color="text.secondary" textAlign="center">
        No templates yet
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        Create your first template to get started building meals and routines
      </Typography>
      <Stack direction="row" spacing={2}>
        <Tooltip title="Individual meal or activity with variables">
          <Button
            variant="contained"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={onCreateBusyClick}
            sx={{ flex: 1 }}
          >
            Create Busy Template
          </Button>
        </Tooltip>
        <Tooltip title="Container for organizing multiple templates">
          <Button
            variant="contained"
            size="large"
            color="success"
            startIcon={<AccountTreeIcon />}
            onClick={onCreateLaneClick}
            sx={{ flex: 1 }}
          >
            Create Lane Template
          </Button>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
