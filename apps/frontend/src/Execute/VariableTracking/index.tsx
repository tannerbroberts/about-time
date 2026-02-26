import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useExecuteContext } from '../useContext';
import { calculateTrajectory } from '../utils/trajectoryCalculators';

import { VariableProgress } from './VariableProgress';

export function VariableTracking(): React.ReactElement {
  const { state } = useExecuteContext();

  const hasWillProduce = Object.keys(state.laneGoals.willProduce).length > 0;
  const hasWillConsume = Object.keys(state.laneGoals.willConsume).length > 0;
  const hasAnyGoals = hasWillProduce || hasWillConsume;

  if (!hasAnyGoals) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No goals set for today. Goals are defined by the lane&apos;s willProduce/willConsume values.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Progress Toward Goals
        </Typography>

        {hasWillProduce && (
          <Box sx={{ mb: hasWillConsume ? 2 : 0 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Production
            </Typography>
            {Object.entries(state.laneGoals.willProduce).map(([variableName, goalValue]) => {
              const consumed = state.consumedVariables.willProduce[variableName] || 0;
              const trajectory = calculateTrajectory(consumed, goalValue, state.currentTime, state.scheduledMeals);

              return (
                <VariableProgress
                  key={`produce-${variableName}`}
                  variableName={variableName}
                  consumed={consumed}
                  goal={goalValue}
                  trajectory={trajectory}
                />
              );
            })}
          </Box>
        )}

        {hasWillProduce && hasWillConsume && <Divider sx={{ my: 2 }} />}

        {hasWillConsume && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Consumption
            </Typography>
            {Object.entries(state.laneGoals.willConsume).map(([variableName, goalValue]) => {
              const consumed = state.consumedVariables.willConsume[variableName] || 0;
              const trajectory = calculateTrajectory(consumed, goalValue, state.currentTime, state.scheduledMeals);

              return (
                <VariableProgress
                  key={`consume-${variableName}`}
                  variableName={variableName}
                  consumed={consumed}
                  goal={goalValue}
                  trajectory={trajectory}
                />
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
