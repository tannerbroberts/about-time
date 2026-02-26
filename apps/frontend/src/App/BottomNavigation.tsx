import BuildIcon from '@mui/icons-material/Build';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MuiBottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import React from 'react';

import { useAppContext } from './useContext';

export function BottomNavigation(): React.ReactElement {
  const { state, dispatch } = useAppContext();

  const handleChange = (_event: React.SyntheticEvent, newValue: 'build' | 'schedule' | 'track'): void => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab: newValue });
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <MuiBottomNavigation value={state.activeTab} onChange={handleChange} showLabels>
        <BottomNavigationAction label="Build" value="build" icon={<BuildIcon />} />
        <BottomNavigationAction label="Schedule" value="schedule" icon={<CalendarTodayIcon />} />
        <BottomNavigationAction label="Track" value="track" icon={<TrackChangesIcon />} />
      </MuiBottomNavigation>
    </Paper>
  );
}
