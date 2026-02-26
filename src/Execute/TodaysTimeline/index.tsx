import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useExecuteContext } from '../useContext';

import { MealTimelineCard } from './MealTimelineCard';

export function TodaysTimeline(): React.ReactElement {
  const { state } = useExecuteContext();

  if (state.scheduledMeals.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No meals scheduled for today.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Today&apos;s Timeline
      </Typography>
      {state.scheduledMeals.map((meal) => {
        const isCurrent = meal.time <= state.currentTime && !meal.completed && !meal.skipped;
        const isMissed = meal.time < state.currentTime && !meal.completed && !meal.skipped;

        return (
          <MealTimelineCard
            key={meal.id}
            meal={meal}
            isCurrent={isCurrent}
            isMissed={isMissed}
          />
        );
      })}
    </Box>
  );
}
