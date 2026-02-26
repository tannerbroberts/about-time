
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import React from 'react';

import { useScheduleContext } from './useContext';
import { formatDateKey } from './utils/dateHelpers';

export function ScheduleFAB(): React.ReactElement {
  const { state, dispatch } = useScheduleContext();

  const handleClick = (): void => {
    const now = new Date();
    const dateKey = formatDateKey(state.selectedDate);

    dispatch({
      type: 'OPEN_SCHEDULER',
      context: {
        dateKey,
        clickTime: now,
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      },
    });
  };

  const isEmpty = Object.keys(state.scheduleLanes).length === 0;

  return (
    <Fab
      color="primary"
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: 72,
        right: 16,
        animation: isEmpty ? 'pulse 2s infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
        },
      }}
    >
      <AddIcon />
    </Fab>
  );
}
