
import EventIcon from '@mui/icons-material/Event';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

export function EmptyState(): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        px: 3,
      }}
    >
      <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        No Meals Scheduled
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Click the + button to add your first meal
      </Typography>
    </Box>
  );
}
