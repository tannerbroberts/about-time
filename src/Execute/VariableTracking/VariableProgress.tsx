import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import React from 'react';

import type { TrajectoryResult } from '../utils/trajectoryCalculators';

interface VariableProgressProps {
  variableName: string;
  consumed: number;
  goal: number;
  trajectory: TrajectoryResult;
}

export function VariableProgress({ variableName, consumed, goal, trajectory }: VariableProgressProps): React.ReactElement {
  const remaining = goal - consumed;
  const progress = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          {variableName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {consumed.toFixed(1)} / {goal.toFixed(1)} ({remaining.toFixed(1)} left)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={trajectory.color}
        sx={{
          height: 8,
          borderRadius: 1,
        }}
      />
      <Typography variant="caption" color={`${trajectory.color}.main`} sx={{ mt: 0.5, display: 'block' }}>
        {trajectory.status === 'on-track' && 'On track'}
        {trajectory.status === 'ahead' && 'Ahead of schedule'}
        {trajectory.status === 'behind' && 'Behind schedule'}
      </Typography>
    </Box>
  );
}
