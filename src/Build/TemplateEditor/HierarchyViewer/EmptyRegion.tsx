import Box from '@mui/material/Box';
import React from 'react';

import { useBuildStore } from '../../store';
import { calculateSegmentPosition, calculateSegmentWidth } from '../../utils/positioning';

export interface EmptyRegionProps {
  start: number;
  end: number;
  baseDuration: number;
  depth: number;
  cumulativeOffset: number;
}

export function EmptyRegion({ start, end, baseDuration, depth, cumulativeOffset }: EmptyRegionProps): React.ReactElement {
  const openSegmentAddOverlay = useBuildStore((state) => state.openSegmentAddOverlay);

  const leftPercent = calculateSegmentPosition(cumulativeOffset + start, baseDuration);
  const widthPercent = calculateSegmentWidth(end - start, baseDuration);

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    openSegmentAddOverlay({ start, end }, { x: e.clientX, y: e.clientY });
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: 'absolute',
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        bottom: `${(depth + 1) * 60}px`,
        height: '50px',
        border: '2px dashed',
        borderColor: 'primary.main',
        borderRadius: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'action.hover',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: 'action.selected',
          borderColor: 'primary.dark',
        },
      }}
    >
      <Box
        sx={{
          fontSize: '0.75rem',
          color: 'text.secondary',
          fontWeight: 500,
        }}
      >
        + Add Segment
      </Box>
    </Box>
  );
}
