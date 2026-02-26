
import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { addSegmentToEnd, createLaneTemplate } from '@tannerbroberts/about-time-core';
import type { BusyTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useBuildStore } from '../../Build/store';
import { useScheduleContext } from '../useContext';
import { calculateLaneNutrition } from '../utils/nutritionCalculators';

import { NutritionImpact } from './NutritionImpact';
import { TemplateSelector } from './TemplateSelector';
import { TimePicker } from './TimePicker';

export function InlineScheduler(): React.ReactElement {
  const { state, dispatch } = useScheduleContext();
  const buildStore = useBuildStore();

  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');

  React.useEffect(() => {
    if (state.isSchedulerOpen && state.schedulerContext) {
      const hours = state.schedulerContext.clickTime.getHours();
      const minutes = state.schedulerContext.clickTime.getMinutes();
      setSelectedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }, [state.isSchedulerOpen, state.schedulerContext]);

  const handleClose = (): void => {
    dispatch({ type: 'CLOSE_SCHEDULER' });
    setSelectedTemplateId('');
    setSelectedTime('');
  };

  const handleSubmit = (): void => {
    if (!selectedTemplateId || !selectedTime || !state.schedulerContext) return;

    const { dateKey } = state.schedulerContext;
    const [hours, minutes] = selectedTime.split(':').map(Number);

    const offsetMs = (hours * 60 + minutes) * 60 * 1000;

    let laneId = state.scheduleLanes[dateKey];
    const templatesClone = { ...state.templates };

    if (!laneId) {
      const newLane = createLaneTemplate(
        {
          intent: `Schedule for ${dateKey}`,
          estimatedDuration: 24 * 60 * 60 * 1000,
          segments: [],
        },
        templatesClone,
        () => crypto.randomUUID(),
      );

      laneId = newLane.id;
    }

    const relationshipId = crypto.randomUUID();
    const updatedLane = addSegmentToEnd(laneId, selectedTemplateId, relationshipId, templatesClone);

    if (updatedLane && updatedLane.segments.length > 0) {
      const lastSegment = updatedLane.segments[updatedLane.segments.length - 1];
      lastSegment.offset = offsetMs;
      templatesClone[laneId] = updatedLane;
    }

    Object.keys(templatesClone).forEach((id) => {
      buildStore.updateTemplate(id, templatesClone[id]);
    });

    dispatch({ type: 'HYDRATE_TEMPLATES', templates: templatesClone });
    dispatch({ type: 'ADD_MEAL_TO_SCHEDULE', dateKey, laneId });

    handleClose();
  };

  if (!state.isSchedulerOpen || !state.schedulerContext) {
    return <></>;
  }

  const laneId = state.scheduleLanes[state.schedulerContext.dateKey];
  const currentTotals = laneId ? calculateLaneNutrition(laneId, state.templates) : {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
  };

  const selectedMeal = selectedTemplateId
    ? (state.templates[selectedTemplateId] as BusyTemplate | undefined) || null
    : null;

  const canSubmit = selectedTemplateId && selectedTime;

  return (
    <Dialog fullScreen open={state.isSchedulerOpen} onClose={handleClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            Add Meal to Schedule
          </Typography>
          <Button color="inherit" onClick={handleSubmit} disabled={!canSubmit}>
            Add Meal
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', width: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <TemplateSelector
            templates={state.templates}
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <TimePicker value={selectedTime} onChange={setSelectedTime} />
        </Box>

        {selectedMeal && (
          <NutritionImpact
            currentTotals={currentTotals}
            selectedMeal={selectedMeal}
            dailyGoals={state.dailyGoals}
          />
        )}
      </Box>
    </Dialog>
  );
}
