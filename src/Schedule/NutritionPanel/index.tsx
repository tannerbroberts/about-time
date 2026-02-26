
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useScheduleContext } from '../useContext';
import { formatDateKey } from '../utils/dateHelpers';
import { calculateLaneNutrition } from '../utils/nutritionCalculators';

import { MacroProgress } from './MacroProgress';

export function NutritionPanel(): React.ReactElement {
  const { state } = useScheduleContext();

  const dateKey = formatDateKey(state.selectedDate);
  const laneId = state.scheduleLanes[dateKey];

  const totals = React.useMemo(() => {
    if (!laneId) {
      return { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
    }
    return calculateLaneNutrition(laneId, state.templates);
  }, [laneId, state.templates]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Daily Nutrition
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        <MacroProgress
          label="Calories"
          value={totals.calories}
          goal={state.dailyGoals.calories}
        />
        <MacroProgress
          label="Protein"
          value={totals.protein_g}
          goal={state.dailyGoals.protein_g}
          unit="g"
        />
        <MacroProgress
          label="Carbs"
          value={totals.carbs_g}
          goal={state.dailyGoals.carbs_g}
          unit="g"
        />
        <MacroProgress
          label="Fats"
          value={totals.fats_g}
          goal={state.dailyGoals.fats_g}
          unit="g"
        />
      </Box>
    </Paper>
  );
}
