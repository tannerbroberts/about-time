import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React from 'react';

export interface EmptyStateProps {
  onChooseTemplate: () => void;
}

export function EmptyState({ onChooseTemplate }: EmptyStateProps): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 3,
      }}
    >
      <Box
        sx={{
          fontSize: '4rem',
          opacity: 0.3,
        }}
      >
        📐
      </Box>
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        Select a template to edit
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
        Choose a template from the library to visualize and edit its composition
      </Typography>
      <Button variant="contained" onClick={onChooseTemplate}>
        Choose Template
      </Button>
    </Box>
  );
}
