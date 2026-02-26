import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../../store';

export function ZoomControls(): React.ReactElement {
  const zoomLevel = useBuildStore((state) => state.zoomLevel);
  const setZoomLevel = useBuildStore((state) => state.setZoomLevel);

  const handleZoomChange = (_event: Event, value: number | number[]): void => {
    setZoomLevel(value as number);
  };

  const handleZoomIn = (): void => {
    setZoomLevel(Math.min(zoomLevel + 0.2, 3.0));
  };

  const handleZoomOut = (): void => {
    setZoomLevel(Math.max(zoomLevel - 0.2, 1.0));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
      <IconButton size="small" onClick={handleZoomOut} disabled={zoomLevel <= 1.0}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Slider
          value={zoomLevel}
          onChange={handleZoomChange}
          min={1.0}
          max={3.0}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value): string => `${Math.round(value * 100)}%`}
          sx={{ flex: 1 }}
        />
        <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
          {Math.round(zoomLevel * 100)}%
        </Typography>
      </Box>
      <IconButton size="small" onClick={handleZoomIn} disabled={zoomLevel >= 3.0}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
