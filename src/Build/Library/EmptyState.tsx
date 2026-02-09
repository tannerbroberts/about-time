import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps): React.ReactElement {
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
      <Button variant="contained" size="large" onClick={onCreateClick}>
        Create Template
      </Button>
    </Stack>
  );
}
