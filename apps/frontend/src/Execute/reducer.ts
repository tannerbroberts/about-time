import type { BusyTemplate, LaneTemplate, TemplateMap } from '@tannerbroberts/about-time-core';
import type { Dispatch } from 'react';

export interface ScheduledMeal {
  id: string;
  time: Date;
  offset: number;
  completed: boolean;
  skipped: boolean;
}

export interface AggregatedVariables {
  willProduce: Record<string, number>;
  willConsume: Record<string, number>;
}

export interface ExecuteState {
  templates: TemplateMap;
  todayLaneId: string | null;
  todayLane: LaneTemplate | null;
  completedMealIds: Set<string>;
  skippedMealIds: Set<string>;
  scheduledMeals: ScheduledMeal[];
  laneGoals: AggregatedVariables;
  consumedVariables: AggregatedVariables;
  currentTime: Date;
  lastUpdated: Date;
}

export type ExecuteAction = | { type: 'HYDRATE_TEMPLATES'; templates: TemplateMap }
  | { type: 'LOAD_TODAY'; laneId: string | null; date: Date }
  | { type: 'COMPLETE_MEAL'; mealId: string }
  | { type: 'UNCOMPLETE_MEAL'; mealId: string }
  | { type: 'SKIP_MEAL'; mealId: string }
  | { type: 'UNSKIP_MEAL'; mealId: string }
  | { type: 'UPDATE_CURRENT_TIME'; time: Date }
  | { type: 'RESET_DAY'; date: Date }
  | { type: 'RESTORE_COMPLETED'; mealIds: Set<string> }
  | { type: 'RESTORE_SKIPPED'; mealIds: Set<string> };

export interface ExecuteContextValue {
  state: ExecuteState;
  dispatch: Dispatch<ExecuteAction>;
}

export const DefaultExecuteState: ExecuteState = {
  templates: {},
  todayLaneId: null,
  todayLane: null,
  completedMealIds: new Set<string>(),
  skippedMealIds: new Set<string>(),
  scheduledMeals: [],
  laneGoals: { willProduce: {}, willConsume: {} },
  consumedVariables: { willProduce: {}, willConsume: {} },
  currentTime: new Date(),
  lastUpdated: new Date(),
};

function computeScheduledMeals(
  lane: LaneTemplate,
  templates: TemplateMap,
  baseDate: Date,
  completedIds: Set<string>,
  skippedIds: Set<string>,
): ScheduledMeal[] {
  const meals: ScheduledMeal[] = [];

  for (const segment of lane.segments || []) {
    const template = templates[segment.templateId];
    if (!template || template.templateType !== 'busy') continue;

    const mealTime = new Date(baseDate.getTime() + segment.offset);

    meals.push({
      id: segment.templateId,
      time: mealTime,
      offset: segment.offset,
      completed: completedIds.has(segment.templateId),
      skipped: skippedIds.has(segment.templateId),
    });
  }

  return meals.sort((a, b) => a.time.getTime() - b.time.getTime());
}

function calculateLaneGoalsFromSegments(lane: LaneTemplate, templates: TemplateMap): AggregatedVariables {
  const totals: AggregatedVariables = {
    willProduce: {},
    willConsume: {},
  };

  for (const segment of lane.segments || []) {
    const template = templates[segment.templateId] as BusyTemplate | undefined;
    if (!template || template.templateType !== 'busy') continue;

    if (template.willProduce) {
      for (const [variableName, value] of Object.entries(template.willProduce)) {
        totals.willProduce[variableName] = (totals.willProduce[variableName] || 0) + (value || 0);
      }
    }

    if (template.willConsume) {
      for (const [variableName, value] of Object.entries(template.willConsume)) {
        totals.willConsume[variableName] = (totals.willConsume[variableName] || 0) + (value || 0);
      }
    }
  }

  return totals;
}

function calculateConsumedVariablesFromMeals(
  completedMealIds: Set<string>,
  templates: TemplateMap,
): AggregatedVariables {
  const totals: AggregatedVariables = {
    willProduce: {},
    willConsume: {},
  };

  for (const mealId of completedMealIds) {
    const template = templates[mealId] as BusyTemplate | undefined;
    if (!template || template.templateType !== 'busy') continue;

    if (template.willProduce) {
      for (const [variableName, value] of Object.entries(template.willProduce)) {
        totals.willProduce[variableName] = (totals.willProduce[variableName] || 0) + (value || 0);
      }
    }

    if (template.willConsume) {
      for (const [variableName, value] of Object.entries(template.willConsume)) {
        totals.willConsume[variableName] = (totals.willConsume[variableName] || 0) + (value || 0);
      }
    }
  }

  return totals;
}

export function reducer(state: ExecuteState, action: ExecuteAction): ExecuteState {
  switch (action.type) {
    case 'HYDRATE_TEMPLATES': {
      const updatedLane = state.todayLaneId
        ? (action.templates[state.todayLaneId] as LaneTemplate | undefined)
        : null;

      const scheduledMeals = updatedLane
        ? computeScheduledMeals(updatedLane, action.templates, state.currentTime, state.completedMealIds, state.skippedMealIds)
        : [];

      return {
        ...state,
        templates: action.templates,
        todayLane: updatedLane || null,
        scheduledMeals,
      };
    }

    case 'LOAD_TODAY': {
      const lane = action.laneId
        ? (state.templates[action.laneId] as LaneTemplate | undefined)
        : null;

      const scheduledMeals = lane
        ? computeScheduledMeals(lane, state.templates, action.date, state.completedMealIds, state.skippedMealIds)
        : [];

      const laneGoals: AggregatedVariables = lane
        ? calculateLaneGoalsFromSegments(lane, state.templates)
        : { willProduce: {}, willConsume: {} };

      return {
        ...state,
        todayLaneId: action.laneId,
        todayLane: lane || null,
        scheduledMeals,
        laneGoals,
        currentTime: action.date,
      };
    }

    case 'COMPLETE_MEAL': {
      const newCompleted = new Set(state.completedMealIds);
      newCompleted.add(action.mealId);

      const newSkipped = new Set(state.skippedMealIds);
      newSkipped.delete(action.mealId);

      const consumedVariables = calculateConsumedVariablesFromMeals(newCompleted, state.templates);

      return {
        ...state,
        completedMealIds: newCompleted,
        skippedMealIds: newSkipped,
        consumedVariables,
        scheduledMeals: state.scheduledMeals.map((m) =>
          (m.id === action.mealId ? { ...m, completed: true, skipped: false } : m)),
      };
    }

    case 'UNCOMPLETE_MEAL': {
      const newCompleted = new Set(state.completedMealIds);
      newCompleted.delete(action.mealId);

      const consumedVariables = calculateConsumedVariablesFromMeals(newCompleted, state.templates);

      return {
        ...state,
        completedMealIds: newCompleted,
        consumedVariables,
        scheduledMeals: state.scheduledMeals.map((m) =>
          (m.id === action.mealId ? { ...m, completed: false } : m)),
      };
    }

    case 'SKIP_MEAL': {
      const newSkipped = new Set(state.skippedMealIds);
      newSkipped.add(action.mealId);

      const newCompleted = new Set(state.completedMealIds);
      newCompleted.delete(action.mealId);

      return {
        ...state,
        skippedMealIds: newSkipped,
        completedMealIds: newCompleted,
        scheduledMeals: state.scheduledMeals.map((m) =>
          (m.id === action.mealId ? { ...m, skipped: true, completed: false } : m)),
      };
    }

    case 'UNSKIP_MEAL': {
      const newSkipped = new Set(state.skippedMealIds);
      newSkipped.delete(action.mealId);

      return {
        ...state,
        skippedMealIds: newSkipped,
        scheduledMeals: state.scheduledMeals.map((m) =>
          (m.id === action.mealId ? { ...m, skipped: false } : m)),
      };
    }

    case 'UPDATE_CURRENT_TIME':
      return { ...state, currentTime: action.time };

    case 'RESET_DAY':
      return {
        ...state,
        completedMealIds: new Set<string>(),
        skippedMealIds: new Set<string>(),
        consumedVariables: { willProduce: {}, willConsume: {} },
        currentTime: action.date,
        lastUpdated: action.date,
        scheduledMeals: state.scheduledMeals.map((m) => ({ ...m, completed: false, skipped: false })),
      };

    case 'RESTORE_COMPLETED': {
      const consumedVariables = calculateConsumedVariablesFromMeals(action.mealIds, state.templates);
      return {
        ...state,
        completedMealIds: action.mealIds,
        consumedVariables,
        scheduledMeals: state.scheduledMeals.map((m) =>
          (action.mealIds.has(m.id) ? { ...m, completed: true } : m)),
      };
    }

    case 'RESTORE_SKIPPED':
      return {
        ...state,
        skippedMealIds: action.mealIds,
        scheduledMeals: state.scheduledMeals.map((m) =>
          (action.mealIds.has(m.id) ? { ...m, skipped: true } : m)),
      };

    default:
      return state;
  }
}
