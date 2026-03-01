import Container from '@mui/material/Container';
import React from 'react';

import { CalendarView } from './CalendarView';
import { EmptyState } from './EmptyState';
import { useBuildTemplates } from './hooks/useBuildTemplates';
import { InlineScheduler } from './InlineScheduler';
import { NutritionPanel } from './NutritionPanel';
import { ScheduleProvider } from './Provider';
import { DefaultScheduleState, reducer } from './reducer';
import { ScheduleFAB } from './ScheduleFAB';
import { shallowEqual } from './utils/comparison';
import { formatDateKey, getDateRangeForView } from './utils/dateRangeHelpers';
import {
  loadDailyGoals,
  loadScheduleLanes,
  saveScheduleLanesToCache,
  setScheduleLane,
  removeScheduleLane,
} from './utils/localStorage';
import { scheduleCacheManager } from './utils/scheduleCacheManager';

export function Schedule(): React.ReactElement {
  const buildTemplates = useBuildTemplates();
  const [scheduleState, scheduleDispatch] = React.useReducer(reducer, DefaultScheduleState);
  const isInitialMount = React.useRef(true);
  const previousLanes = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    scheduleDispatch({ type: 'HYDRATE_TEMPLATES', templates: buildTemplates });
  }, [buildTemplates]);

  // Load data from API on mount
  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      const [lanes, goals] = await Promise.all([loadScheduleLanes(), loadDailyGoals()]);
      scheduleDispatch({ type: 'HYDRATE_SCHEDULE_LANES', lanes });
      if (goals) {
        // Map API response (proteinG, carbsG, fatsG) to frontend format (protein_g, carbs_g, fats_g)
        scheduleDispatch({
          type: 'SET_DAILY_GOALS',
          goals: {
            calories: goals.calories,
            protein_g: goals.proteinG,
            carbs_g: goals.carbsG,
            fats_g: goals.fatsG,
          },
        });
      }
      previousLanes.current = lanes;
    };
    loadData();
  }, []);

  // Sync changes to API with shallow comparison
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Detect changes and sync to API
    const syncChanges = async (): Promise<void> => {
      const currentLanes = scheduleState.scheduleLanes;
      const prev = previousLanes.current;

      // Shallow comparison to prevent unnecessary syncs
      if (shallowEqual(currentLanes, prev)) {
        return;
      }

      // Find added/updated lanes
      for (const [dateKey, laneId] of Object.entries(currentLanes)) {
        if (prev[dateKey] !== laneId) {
          try {
            await setScheduleLane(dateKey, laneId);
            // Invalidate cache for this date
            scheduleCacheManager.invalidate(dateKey);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to sync lane for ${dateKey}:`, error);
          }
        }
      }

      // Find removed lanes
      for (const dateKey of Object.keys(prev)) {
        if (!(dateKey in currentLanes)) {
          try {
            await removeScheduleLane(dateKey);
            // Invalidate cache for this date
            scheduleCacheManager.invalidate(dateKey);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to remove lane for ${dateKey}:`, error);
          }
        }
      }

      // Update cache and tracking
      saveScheduleLanesToCache(currentLanes);
      previousLanes.current = currentLanes;
    };

    syncChanges();
  }, [scheduleState.scheduleLanes]);

  // Load data for current view on view/date changes
  React.useEffect(() => {
    const loadDataForView = async (): Promise<void> => {
      const { start, end } = getDateRangeForView(scheduleState.selectedDate, scheduleState.currentView);
      const startDate = formatDateKey(start);
      const endDate = formatDateKey(end);

      try {
        const lanes = await scheduleCacheManager.fetchForRange(startDate, endDate);
        scheduleDispatch({ type: 'HYDRATE_SCHEDULE_LANES', lanes });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load schedule lanes:', error);
      }
    };

    loadDataForView();
  }, [scheduleState.currentView, scheduleState.selectedDate]);

  const contextValue = React.useMemo(
    () => ({ state: scheduleState, dispatch: scheduleDispatch }),
    [scheduleState],
  );

  const hasScheduledMeals = Object.keys(scheduleState.scheduleLanes).length > 0;

  return (
    <ScheduleProvider value={contextValue}>
      <Container maxWidth="lg" sx={{ py: 3, pb: 10 }}>
        {hasScheduledMeals ? (
          <>
            <NutritionPanel />
            <CalendarView />
          </>
        ) : (
          <EmptyState />
        )}
        <ScheduleFAB />
        <InlineScheduler />
      </Container>
    </ScheduleProvider>
  );
}
