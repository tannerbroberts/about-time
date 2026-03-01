
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React from 'react';

import type { ViewType } from '../reducer';
import { useScheduleContext } from '../useContext';
import { formatDisplayDate } from '../utils/dateHelpers';
import { ViewSwitcher } from '../ViewSwitcher';

import { DayView } from './DayView';
import { WeekView } from './WeekView';

export function CalendarView(): React.ReactElement {
  const { state, dispatch } = useScheduleContext();

  const handlePrevDay = (): void => {
    dispatch({ type: 'NAVIGATE_DATE', direction: 'prev' });
  };

  const handleNextDay = (): void => {
    dispatch({ type: 'NAVIGATE_DATE', direction: 'next' });
  };

  const handleToday = (): void => {
    dispatch({ type: 'SET_DATE', date: new Date() });
  };

  const handleViewChange = (view: ViewType): void => {
    dispatch({ type: 'SET_VIEW', view });
  };

  const displayDate = formatDisplayDate(state.selectedDate);
  const isToday = state.selectedDate.toDateString() === new Date().toDateString();

  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevDay} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={handleNextDay} size="small">
            <ChevronRightIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>
            {displayDate}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ViewSwitcher currentView={state.currentView} onChange={handleViewChange} />
          {!isToday && (
            <Typography
              variant="button"
              sx={{ cursor: 'pointer', color: 'primary.main' }}
              onClick={handleToday}
            >
              Today
            </Typography>
          )}
        </Box>
      </Box>

      {state.currentView === 'day' && <DayView />}
      {state.currentView === 'week' && <WeekView />}
      {(state.currentView === 'month' || state.currentView === 'year') && (
        <Typography variant="body1" sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          {state.currentView.charAt(0).toUpperCase() + state.currentView.slice(1)} view coming soon
        </Typography>
      )}
    </Paper>
  );
}
