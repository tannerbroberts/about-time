import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../../store';

export function DepthControls(): React.ReactElement {
  const maxDepth = useBuildStore((state) => state.maxDepth);
  const setMaxDepth = useBuildStore((state) => state.setMaxDepth);

  const handleDepthChange = (_event: Event, value: number | number[]): void => {
    setMaxDepth(value as number);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 250 }}>
      <Typography variant="body2" sx={{ minWidth: 120 }}>
        Show up to {maxDepth} {maxDepth === 1 ? 'level' : 'levels'}
      </Typography>
      <Slider
        value={maxDepth}
        onChange={handleDepthChange}
        min={1}
        max={10}
        step={1}
        marks
        valueLabelDisplay="auto"
        sx={{ flex: 1 }}
      />
    </Box>
  );
}
