import Container from '@mui/material/Container';
import React from 'react';

import { useBuildStore } from '../Build/store';
import { formatDateKey } from '../Schedule/utils/dateHelpers';
import { loadScheduleLanes } from '../Schedule/utils/localStorage';

import { EmptyState } from './EmptyState';
import { NextMealCountdown } from './NextMealCountdown';
import { ExecuteProvider } from './Provider';
import { DefaultExecuteState, reducer } from './reducer';
import { TodaysTimeline } from './TodaysTimeline';
import {
  loadDailyState,
  saveDailyStateToCache,
  updateDailyState,
} from './utils/localStorage';
import { VariableTracking } from './VariableTracking';

export function Execute(): React.ReactElement {
  const buildTemplates = useBuildStore((state) => state.templates);
  const [executeState, executeDispatch] = React.useReducer(reducer, DefaultExecuteState);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    executeDispatch({ type: 'HYDRATE_TEMPLATES', templates: buildTemplates });
  }, [buildTemplates]);

  // Load today's data from API on mount
  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      const todayKey = formatDateKey(new Date());
      const scheduleLanes = await loadScheduleLanes();
      const todayLaneId = scheduleLanes[todayKey] || null;

      executeDispatch({ type: 'LOAD_TODAY', laneId: todayLaneId, date: new Date() });

      const dailyState = await loadDailyState(todayKey);
      if (dailyState.completedMealIds.length > 0) {
        executeDispatch({ type: 'RESTORE_COMPLETED', mealIds: new Set(dailyState.completedMealIds) });
      }
      if (dailyState.skippedMealIds.length > 0) {
        executeDispatch({ type: 'RESTORE_SKIPPED', mealIds: new Set(dailyState.skippedMealIds) });
      }
    };
    loadData();
  }, []);

  // Sync changes to API
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const syncChanges = async (): Promise<void> => {
      const todayKey = formatDateKey(new Date());
      const completedIds = Array.from(executeState.completedMealIds);
      const skippedIds = Array.from(executeState.skippedMealIds);

      try {
        await updateDailyState(todayKey, completedIds, skippedIds);
        saveDailyStateToCache(todayKey, {
          completedMealIds: completedIds,
          skippedMealIds: skippedIds,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to sync daily state:', error);
      }
    };

    syncChanges();
  }, [executeState.completedMealIds, executeState.skippedMealIds]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      executeDispatch({ type: 'UPDATE_CURRENT_TIME', time: new Date() });
    }, 60000);
    return (): void => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const lastDate = formatDateKey(executeState.lastUpdated);
    const todayDate = formatDateKey(new Date());

    if (lastDate !== todayDate) {
      executeDispatch({ type: 'RESET_DAY', date: new Date() });
    }
  }, [executeState.lastUpdated]);

  const contextValue = React.useMemo(
    () => ({ state: executeState, dispatch: executeDispatch }),
    [executeState],
  );

  const hasSchedule = executeState.todayLaneId !== null;

  return (
    <ExecuteProvider value={contextValue}>
      <Container maxWidth="lg" sx={{ py: 3, pb: 10 }}>
        {hasSchedule ? (
          <>
            <NextMealCountdown />
            <VariableTracking />
            <TodaysTimeline />
          </>
        ) : (
          <EmptyState />
        )}
      </Container>
    </ExecuteProvider>
  );
}
