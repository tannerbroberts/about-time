
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

export function WeekView(): React.ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        Week View (Coming Soon)
      </Typography>
    </Box>
  );
}
