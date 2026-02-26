
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { HOUR_HEIGHT } from '../utils/timeHelpers';

interface MealBlockProps {
  meal: BusyTemplate;
  offset: number;
  isSelected: boolean;
  onClick: () => void;
}

export function MealBlock({ meal, offset, isSelected, onClick }: MealBlockProps): React.ReactElement {
  const yPosition = (offset / 3600000) * HOUR_HEIGHT;
  const height = ((meal.estimatedDuration || 1800000) / 3600000) * HOUR_HEIGHT;

  const calories = meal.willProduce?.calories || 0;
  const protein = meal.willProduce?.protein_g || 0;

  return (
    <Card
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        position: 'absolute',
        top: yPosition,
        left: 80,
        right: 16,
        height: Math.max(height, 40),
        cursor: 'pointer',
        borderLeft: 4,
        borderLeftColor: 'primary.main',
        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        transition: 'background-color 0.2s',
      }}
    >
      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" fontWeight={500}>
          {meal.intent}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {calories} cal • {protein}g protein
        </Typography>
      </CardContent>
    </Card>
  );
}
