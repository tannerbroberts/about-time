import Box from '@mui/material/Box';
import React from 'react';

import { timeToYPosition, HOUR_HEIGHT } from '../utils/timeHelpers';

export function CurrentTimeIndicator(): React.ReactElement {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return (): void => clearInterval(interval);
  }, []);

  const yPosition = timeToYPosition(currentTime, HOUR_HEIGHT);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: yPosition,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'error.main',
        zIndex: 10,
        pointerEvents: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: -6,
          top: -4,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: 'error.main',
        },
      }}
    />
  );
}
