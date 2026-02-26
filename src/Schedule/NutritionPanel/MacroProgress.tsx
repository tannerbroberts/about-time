
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import React from 'react';

interface MacroProgressProps {
  label: string;
  value: number;
  goal: number;
  unit?: string;
}

export function MacroProgress({ label, value, goal, unit = '' }: MacroProgressProps): React.ReactElement {
  const percent = Math.min((value / goal) * 100, 100);
  const isGoalMet = value >= goal;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(value)}{unit} / {goal}{unit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={isGoalMet ? 'success' : 'primary'}
        sx={{ height: 8, borderRadius: 1 }}
      />
    </Box>
  );
}
