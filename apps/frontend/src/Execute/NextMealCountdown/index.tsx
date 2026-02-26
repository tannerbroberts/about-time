import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { formatTime } from '../../Schedule/utils/timeHelpers';
import { useExecuteContext } from '../useContext';
import { formatCountdown, getNextScheduledMeal, getTimeUntilMeal } from '../utils/countdownHelpers';

export function NextMealCountdown(): React.ReactElement {
  const { state, dispatch } = useExecuteContext();

  const nextMeal = getNextScheduledMeal(state.scheduledMeals, state.currentTime);

  const handleCompleteMeal = (): void => {
    if (nextMeal) {
      dispatch({ type: 'COMPLETE_MEAL', mealId: nextMeal.id });
    }
  };

  const handleSkipMeal = (): void => {
    if (nextMeal) {
      dispatch({ type: 'SKIP_MEAL', mealId: nextMeal.id });
    }
  };

  if (!nextMeal) {
    const allCompleted = state.scheduledMeals.every((m) => m.completed || m.skipped);
    return (
      <Card sx={{ mb: 3, bgcolor: 'success.light' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            {allCompleted ? 'All meals complete!' : 'No more meals today'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {allCompleted ? 'Great job sticking to your plan!' : 'Check your schedule for more meals.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const mealTemplate = state.templates[nextMeal.id] as BusyTemplate | undefined;
  const mealIntent = mealTemplate?.intent || 'Next Meal';
  const timeUntil = getTimeUntilMeal(nextMeal, state.currentTime);
  const countdownText = formatCountdown(timeUntil);
  const isTimeToEat = timeUntil <= 0;

  return (
    <Card sx={{ mb: 3, bgcolor: isTimeToEat ? 'warning.light' : 'background.paper' }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {mealIntent}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {formatTime(nextMeal.time)}
        </Typography>
        <Typography variant="h3" sx={{ my: 2, fontWeight: 'bold', color: isTimeToEat ? 'warning.dark' : 'primary.main' }}>
          {countdownText}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" startIcon={<SkipNextIcon />} onClick={handleSkipMeal}>
            Skip
          </Button>
          <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={handleCompleteMeal}>
            Ate It
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
