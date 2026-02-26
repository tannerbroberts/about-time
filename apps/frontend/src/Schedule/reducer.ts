import type { TemplateMap } from '@tannerbroberts/about-time-core';
import type { Dispatch } from 'react';

export interface DailyGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface SchedulerContext {
  dateKey: string;
  clickTime: Date;
  position: { x: number; y: number };
}

export interface ScheduleState {
  templates: TemplateMap;
  scheduleLanes: Record<string, string>;
  currentView: 'day' | 'week';
  selectedDate: Date;
  dailyGoals: DailyGoals;
  isSchedulerOpen: boolean;
  schedulerContext: SchedulerContext | null;
  selectedMealId: string | null;
}

export type ScheduleAction = | { type: 'HYDRATE_TEMPLATES'; templates: TemplateMap }
  | { type: 'HYDRATE_SCHEDULE_LANES'; lanes: Record<string, string> }
  | { type: 'SET_DATE'; date: Date }
  | { type: 'NAVIGATE_DATE'; direction: 'prev' | 'next' }
  | { type: 'OPEN_SCHEDULER'; context: SchedulerContext }
  | { type: 'CLOSE_SCHEDULER' }
  | { type: 'ADD_MEAL_TO_SCHEDULE'; dateKey: string; laneId: string }
  | { type: 'REMOVE_MEAL'; dateKey: string; segmentId: string }
  | { type: 'SET_DAILY_GOALS'; goals: DailyGoals }
  | { type: 'SET_SELECTED_MEAL'; mealId: string | null }
  | { type: 'SET_VIEW'; view: 'day' | 'week' };

export interface ScheduleContextValue {
  state: ScheduleState;
  dispatch: Dispatch<ScheduleAction>;
}

export const DefaultScheduleState: ScheduleState = {
  templates: {},
  scheduleLanes: {},
  currentView: 'day',
  selectedDate: new Date(),
  dailyGoals: {
    calories: 2000,
    protein_g: 150,
    carbs_g: 250,
    fats_g: 65,
  },
  isSchedulerOpen: false,
  schedulerContext: null,
  selectedMealId: null,
};

export function reducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'HYDRATE_TEMPLATES':
      return { ...state, templates: action.templates };

    case 'HYDRATE_SCHEDULE_LANES':
      return { ...state, scheduleLanes: action.lanes };

    case 'SET_DATE':
      return { ...state, selectedDate: action.date };

    case 'NAVIGATE_DATE': {
      const newDate = new Date(state.selectedDate);
      if (action.direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      return { ...state, selectedDate: newDate };
    }

    case 'OPEN_SCHEDULER':
      return {
        ...state,
        isSchedulerOpen: true,
        schedulerContext: action.context,
      };

    case 'CLOSE_SCHEDULER':
      return {
        ...state,
        isSchedulerOpen: false,
        schedulerContext: null,
      };

    case 'ADD_MEAL_TO_SCHEDULE':
      return {
        ...state,
        scheduleLanes: {
          ...state.scheduleLanes,
          [action.dateKey]: action.laneId,
        },
      };

    case 'REMOVE_MEAL':
      return state;

    case 'SET_DAILY_GOALS':
      return { ...state, dailyGoals: action.goals };

    case 'SET_SELECTED_MEAL':
      return { ...state, selectedMealId: action.mealId };

    case 'SET_VIEW':
      return { ...state, currentView: action.view };

    default:
      return state;
  }
}
