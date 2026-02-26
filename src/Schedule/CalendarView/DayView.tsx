
import Box from '@mui/material/Box';
import type { LaneTemplate } from '@tannerbroberts/about-time-core';
import React from 'react';

import { useScheduleContext } from '../useContext';
import { formatDateKey } from '../utils/dateHelpers';
import { generateTimeSlots, yPositionToTime, HOUR_HEIGHT } from '../utils/timeHelpers';

import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { MealBlock } from './MealBlock';
import { TimeSlots } from './TimeSlots';

export function DayView(): React.ReactElement {
  const { state, dispatch } = useScheduleContext();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const dateKey = formatDateKey(state.selectedDate);
  const laneId = state.scheduleLanes[dateKey];
  const lane = laneId ? (state.templates[laneId] as LaneTemplate | undefined) : undefined;

  const timeSlots = React.useMemo(() => generateTimeSlots(HOUR_HEIGHT), []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickTime = yPositionToTime(y, state.selectedDate, HOUR_HEIGHT);

    dispatch({
      type: 'OPEN_SCHEDULER',
      context: {
        dateKey,
        clickTime,
        position: { x: e.clientX, y: e.clientY },
      },
    });
  };

  const isToday = state.selectedDate.toDateString() === new Date().toDateString();

  return (
    <Box
      ref={containerRef}
      onClick={handleClick}
      sx={{
        position: 'relative',
        height: HOUR_HEIGHT * 24,
        backgroundColor: 'background.default',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <TimeSlots slots={timeSlots} />

      {lane?.segments?.map((segment) => {
        const meal = state.templates[segment.templateId];
        if (!meal || meal.templateType !== 'busy') return null;

        return (
          <MealBlock
            key={segment.templateId}
            meal={meal}
            offset={segment.offset}
            isSelected={state.selectedMealId === segment.templateId}
            onClick={() => dispatch({ type: 'SET_SELECTED_MEAL', mealId: segment.templateId })}
          />
        );
      })}

      {isToday && <CurrentTimeIndicator />}
    </Box>
  );
}
