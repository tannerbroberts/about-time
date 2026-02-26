
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import React from 'react';

import type { TimeSlot } from '../utils/timeHelpers';

interface TimeSlotsProps {
  slots: TimeSlot[];
}

export function TimeSlots({ slots }: TimeSlotsProps): React.ReactElement {
  return (
    <Box>
      {slots.map((slot) => (
        <Box
          key={slot.hour}
          sx={{
            position: 'absolute',
            top: slot.yPosition,
            left: 0,
            right: 0,
            height: 1,
          }}
        >
          <Divider />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 8,
              top: 4,
              color: 'text.secondary',
            }}
          >
            {slot.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
