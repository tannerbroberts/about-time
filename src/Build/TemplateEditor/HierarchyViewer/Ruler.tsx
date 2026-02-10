import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

import { formatDuration } from '../../utils/positioning';

export interface RulerProps {
  duration: number; // in milliseconds
}

export function Ruler({ duration }: RulerProps): React.ReactElement {
  // Calculate appropriate intervals (aim for 5-10 labels)
  const targetLabels = 8;
  const intervalMs = Math.ceil(duration / targetLabels / 60000) * 60000; // Round to nearest minute

  const labels: Array<{ position: number; label: string }> = [];

  for (let time = 0; time <= duration; time += intervalMs) {
    const position = (time / duration) * 100;
    labels.push({
      position,
      label: formatDuration(time),
    });
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {labels.map((label, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: `${label.position}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <Box
            sx={{
              width: '1px',
              height: '8px',
              backgroundColor: 'divider',
              marginBottom: '4px',
            }}
          />
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {label.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
