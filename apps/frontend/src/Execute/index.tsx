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
import { loadTodayCompleted, loadTodaySkipped, saveTodayCompleted, saveTodaySkipped } from './utils/localStorage';
import { VariableTracking } from './VariableTracking';

export function Execute(): React.ReactElement {
  const buildTemplates = useBuildStore((state) => state.templates);
  const [executeState, executeDispatch] = React.useReducer(reducer, DefaultExecuteState);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    executeDispatch({ type: 'HYDRATE_TEMPLATES', templates: buildTemplates });
  }, [buildTemplates]);

  React.useEffect(() => {
    const todayKey = formatDateKey(new Date());
    const scheduleLanes = loadScheduleLanes();
    const todayLaneId = scheduleLanes[todayKey] || null;

    executeDispatch({ type: 'LOAD_TODAY', laneId: todayLaneId, date: new Date() });

    const completedIds = loadTodayCompleted(todayKey);
    if (completedIds.size > 0) {
      executeDispatch({ type: 'RESTORE_COMPLETED', mealIds: completedIds });
    }

    const skippedIds = loadTodaySkipped(todayKey);
    if (skippedIds.size > 0) {
      executeDispatch({ type: 'RESTORE_SKIPPED', mealIds: skippedIds });
    }
  }, []);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const todayKey = formatDateKey(new Date());
    saveTodayCompleted(executeState.completedMealIds, todayKey);
    saveTodaySkipped(executeState.skippedMealIds, todayKey);
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
