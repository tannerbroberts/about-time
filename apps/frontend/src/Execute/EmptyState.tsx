import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useAppContext } from '../App/useContext';

export function EmptyState(): React.ReactElement {
  const { dispatch } = useAppContext();

  const handleGoToSchedule = (): void => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab: 'schedule' });
  };

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
      <CalendarTodayIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        No Schedule for Today
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        You haven&apos;t scheduled any meals for today yet. Head to the Schedule tab to create today&apos;s plan.
      </Typography>
      <Button variant="contained" startIcon={<CalendarTodayIcon />} onClick={handleGoToSchedule}>
        Go to Schedule
      </Button>
    </Box>
  );
}
