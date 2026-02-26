import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { formatTime } from '../../Schedule/utils/timeHelpers';
import type { ScheduledMeal } from '../reducer';
import { useExecuteContext } from '../useContext';

interface MealTimelineCardProps {
  meal: ScheduledMeal;
  isCurrent: boolean;
  isMissed: boolean;
}

export function MealTimelineCard({ meal, isCurrent, isMissed }: MealTimelineCardProps): React.ReactElement {
  const { state, dispatch } = useExecuteContext();

  const mealTemplate = state.templates[meal.id] as BusyTemplate | undefined;
  const mealIntent = mealTemplate?.intent || 'Meal';

  const handleToggleComplete = (): void => {
    if (meal.completed) {
      dispatch({ type: 'UNCOMPLETE_MEAL', mealId: meal.id });
    } else {
      dispatch({ type: 'COMPLETE_MEAL', mealId: meal.id });
    }
  };

  let firstVariable: [string, number] | null = null;
  if (mealTemplate?.willProduce && Object.keys(mealTemplate.willProduce).length > 0) {
    firstVariable = Object.entries(mealTemplate.willProduce)[0];
  } else if (mealTemplate?.willConsume && Object.keys(mealTemplate.willConsume).length > 0) {
    firstVariable = Object.entries(mealTemplate.willConsume)[0];
  }

  return (
    <Card
      sx={{
        mb: 2,
        bgcolor: ((): string => {
          if (meal.completed) return 'action.disabledBackground';
          if (isCurrent) return 'primary.light';
          return 'background.paper';
        })(),
        borderLeft: isCurrent ? 4 : 0,
        borderColor: 'primary.main',
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2 } }}>
        <Checkbox
          checked={meal.completed}
          onChange={handleToggleComplete}
          disabled={meal.skipped}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: 32 },
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ textDecoration: meal.completed ? 'line-through' : 'none' }}>
              {mealIntent}
            </Typography>
            {meal.skipped && <Chip label="Skipped" size="small" color="default" />}
            {isMissed && !meal.completed && !meal.skipped && <Chip label="Missed" size="small" color="warning" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatTime(meal.time)}
          </Typography>
          {firstVariable && (
            <Typography variant="caption" color="text.secondary">
              {firstVariable[0]}: {firstVariable[1]}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
