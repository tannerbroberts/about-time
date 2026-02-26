
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import type { DailyGoals } from '../reducer';
import type { NutritionTotals } from '../utils/nutritionCalculators';

interface NutritionImpactProps {
  currentTotals: NutritionTotals;
  selectedMeal: BusyTemplate | null;
  dailyGoals: DailyGoals;
}

export function NutritionImpact({ currentTotals, selectedMeal, dailyGoals }: NutritionImpactProps): React.ReactElement {
  const newTotals = React.useMemo(() => {
    if (!selectedMeal?.willProduce) return currentTotals;

    return {
      calories: currentTotals.calories + (selectedMeal.willProduce.calories || 0),
      protein_g: currentTotals.protein_g + (selectedMeal.willProduce.protein_g || 0),
      carbs_g: currentTotals.carbs_g + (selectedMeal.willProduce.carbs_g || 0),
      fats_g: currentTotals.fats_g + (selectedMeal.willProduce.fats_g || 0),
    };
  }, [currentTotals, selectedMeal]);

  const renderMacro = (
    label: string,
    current: number,
    newValue: number,
    goal: number,
  ): React.ReactElement => {
    const currentPercent = Math.min((current / goal) * 100, 100);
    const newPercent = Math.min((newValue / goal) * 100, 100);

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          {label}: {Math.round(current)} → {Math.round(newValue)} / {goal}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={currentPercent}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            →
          </Typography>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={newPercent}
              color={newValue >= goal ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Nutrition Impact
      </Typography>
      {renderMacro('Calories', currentTotals.calories, newTotals.calories, dailyGoals.calories)}
      {renderMacro('Protein', currentTotals.protein_g, newTotals.protein_g, dailyGoals.protein_g)}
      {renderMacro('Carbs', currentTotals.carbs_g, newTotals.carbs_g, dailyGoals.carbs_g)}
      {renderMacro('Fats', currentTotals.fats_g, newTotals.fats_g, dailyGoals.fats_g)}
    </Box>
  );
}
