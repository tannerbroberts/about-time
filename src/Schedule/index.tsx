import Container from '@mui/material/Container';
import React from 'react';

import { useBuildStore } from '../Build/store';

import { CalendarView } from './CalendarView';
import { EmptyState } from './EmptyState';
import { InlineScheduler } from './InlineScheduler';
import { NutritionPanel } from './NutritionPanel';
import { ScheduleProvider } from './Provider';
import { DefaultScheduleState, reducer } from './reducer';
import { ScheduleFAB } from './ScheduleFAB';
import { loadDailyGoals, loadScheduleLanes, saveScheduleLanes } from './utils/localStorage';

export function Schedule(): React.ReactElement {
  const buildTemplates = useBuildStore((state) => state.templates);
  const [scheduleState, scheduleDispatch] = React.useReducer(reducer, DefaultScheduleState);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    scheduleDispatch({ type: 'HYDRATE_TEMPLATES', templates: buildTemplates });
  }, [buildTemplates]);

  React.useEffect(() => {
    const lanes = loadScheduleLanes();
    const goals = loadDailyGoals();
    scheduleDispatch({ type: 'HYDRATE_SCHEDULE_LANES', lanes });
    if (goals) {
      scheduleDispatch({ type: 'SET_DAILY_GOALS', goals });
    }
  }, []);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveScheduleLanes(scheduleState.scheduleLanes);
  }, [scheduleState.scheduleLanes]);

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
