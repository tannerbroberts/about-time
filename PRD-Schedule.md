# PRD: Schedule - Calendar Planning & Layout

## Overview

The Schedule feature enables users to arrange meal templates into daily/weekly schedules that meet nutrition goals using visual calendar interfaces and layout operations.

## Goal

Arrange meal templates into daily/weekly schedules that meet nutrition goals through intuitive drag-and-drop and placement interactions.

## User Actions

- Create LaneTemplates representing days or eating windows
- Drag-and-drop meal templates into schedule slots
- Apply layout operations (pack tightly, distribute evenly, add eating windows)
- Set daily/weekly nutrition goals
- Auto-schedule meals to meet goals
- Visualize nutrition distribution across the day/week

## Key Features

### Calendar View
- Day/week/month views with scheduled meals
- Visual representation of time slots
- Existing meals shown as colored blocks
- Large, clear interaction zones

### Drag-and-Drop Scheduling
- Visual meal placement
- Click-to-place interaction pattern
- Real-time feedback on placement
- Snap to time intervals

### Layout Presets
Apply common scheduling patterns:
- **Intermittent fasting** (16:8, eating window)
- **Even distribution** (3 meals + 2 snacks)
- **Backloaded** (small breakfast, large dinner)
- Custom patterns saved as presets

### Goal-Based Scheduling
- Auto-suggest meals to hit daily targets
- Show nutrition impact before adding meal
- Highlight nutrition gaps
- Recommend meals that fill gaps

### Nutrition Timeline
- Visualize macro intake across the day
- Cumulative nutrition graph
- Show when goals are met
- Color-coded indicators

### Conflict Detection
- Warn about overlapping meals
- Flag unmet nutrition goals
- Alert for scheduling conflicts
- Suggest resolutions

### Recurring Schedules
- Set weekly patterns
- Copy days to other days
- Template entire weeks
- Quick schedule duplication

## Example User Story

> As a user, I want to schedule my meals for Monday through Friday following a 16:8 intermittent fasting pattern, automatically distributing meals to hit my daily goal of 2000 calories and 150g protein.

## Technical Implementation

### CRUD Operations with @tannerbroberts/about-time-core

**All template CRUD operations must use the @tannerbroberts/about-time-core npm package.**

```typescript
import {
  type TemplateMap,
  type LaneTemplate,
  createLaneTemplate,
  updateTemplate,
  deleteTemplate,
  addSegmentToEnd,
  applyLaneLayout,
  fitLaneDurationToLast,
} from '@tannerbroberts/about-time-core';
```

The package provides:
- **Create**: `createLaneTemplate()` for creating schedule lanes
- **Read**: Direct access via `TemplateMap.get(id)`
- **Update**: `updateTemplate()` for modifying schedules
- **Delete**: `deleteTemplate()` for removing schedules
- **Layout Operations**: `addSegmentToEnd()`, `applyLaneLayout()`, `fitLaneDurationToLast()`

### LaneTemplate for Daily Schedule

```typescript
// Create a day schedule lane
const mondayLane = createLaneTemplate({
  intent: "Monday - IF 16:8 Schedule",
  estimatedDuration: 24 * 60 * 60 * 1000, // 24 hours
  segments: []
}, templates, generateId);

// Add meal segments
addSegmentToEnd(mondayLane.id, templates, breakfastTemplateId);
addSegmentToEnd(mondayLane.id, templates, lunchTemplateId);
addSegmentToEnd(mondayLane.id, templates, dinnerTemplateId);

// Apply eating window layout (12pm-8pm)
applyLaneLayout(mondayLane.id, templates, {
  justifyContent: 'space-evenly',
  gap: 2 * 60 * 60 * 1000 // 2 hour gaps
});

// Fit lane duration to content
fitLaneDurationToLast(mondayLane.id, templates);
```

### Layout Operations

```typescript
// Pack meals tightly (no gaps)
applyLaneLayout(laneId, templates, {
  justifyContent: 'flex-start',
  gap: 0
});

// Distribute evenly across eating window
applyLaneLayout(laneId, templates, {
  justifyContent: 'space-evenly'
});

// Add eating window (intermittent fasting)
applyLaneLayout(laneId, templates, {
  justifyContent: 'space-between',
  startOffset: 12 * 60 * 60 * 1000, // Start at 12pm
  endOffset: 20 * 60 * 60 * 1000    // End at 8pm
});
```

### Nutrition Calculation

```typescript
// Calculate total nutrition for a day
function calculateDayNutrition(laneId: string, templates: TemplateMap): NutritionTotals {
  const lane = templates.get(laneId) as LaneTemplate;
  const totals: NutritionTotals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0
  };

  for (const segment of lane.segments) {
    const meal = templates.get(segment.busyId);
    if (meal && 'willProduce' in meal) {
      totals.calories += meal.willProduce.calories || 0;
      totals.protein_g += meal.willProduce.protein_g || 0;
      totals.carbs_g += meal.willProduce.carbs_g || 0;
      totals.fats_g += meal.willProduce.fats_g || 0;
    }
  }

  return totals;
}
```

## UI/UX Design Specifications

### Primary Interface

**Iterative design approach**: Start with clean calendar base, refine based on user feedback.

### FAB + Inline Scheduler Flow

**1. Floating Action Button (FAB)**
- Large, colorful "+" button (bottom-right corner)
- Primary action: Add meal to schedule
- Pulse animation when schedule is empty
- Always visible and accessible

**2. Click Schedule to Place**
- User clicks desired time/day on calendar
- Opens inline scheduler UI at click location
- Contextual placement (appears near click point)
- Smooth animation on open

**3. Inline Scheduler UI** (appears on click):

```
┌─────────────────────────────────┐
│  Add Meal                    ✕  │
├─────────────────────────────────┤
│  🔍 Search templates...         │
│                                 │
│  🕐 Time Picker                 │
│     [12:00 PM] [Duration: 15m]  │
│                                 │
│  📊 Impact on Daily Totals      │
│     Calories: 450 / 2000        │
│     Protein:  40g / 150g        │
│                                 │
│  ⚙️ Layout Options              │
│     ○ Insert (push others)      │
│     ○ Replace existing          │
│     ○ Add gap before/after      │
│                                 │
│          [Cancel] [Add Meal]    │
└─────────────────────────────────┘
```

**Components**:
- **Meal Template Selector**: Searchable dropdown with recent meals at top
- **Time Picker**: Hour/minute selection + duration display
- **Quick Nutrition Summary**: Shows how this meal affects daily totals
- **Layout Options**: Radio buttons for insertion behavior
- Compact, focused UI - doesn't obscure calendar
- Keyboard navigation supported (ESC to close, Enter to confirm)

### Calendar Base

**Visual Design**:
- Clear day/week/month view options
- Time slots with hourly markers
- Existing meals as colored blocks
- Hover states for interaction zones
- Current time indicator line
- Weekend vs. weekday distinction

**Meal Blocks**:
- Meal name prominently displayed
- Quick macro summary (calories, protein)
- Duration indicator
- Color coding by meal type or macro profile
- Edit/delete actions on hover

### Layout Control Panel

**Quick Actions**:
- Distribute evenly button
- Pack tightly button
- Add eating window (IF) button
- Custom gap insertion
- Clear schedule button

**Advanced Options**:
- Justify content dropdown (flex-start, center, space-between, space-evenly)
- Gap size input (minutes/hours)
- Start/end offset for eating windows
- Apply to multiple days

### Nutrition Timeline Visualization

**Daily Nutrition Graph**:
- X-axis: Time of day
- Y-axis: Cumulative nutrition values
- Multiple lines for calories, protein, carbs, fats
- Goal indicators as horizontal lines
- Shaded regions showing when goals are met/exceeded

### Responsive Design

**Desktop**:
- Week view as default
- Side panel for meal details
- Drag-and-drop enabled

**Tablet**:
- Day/week toggle
- Bottom sheet for meal details
- Touch-optimized interactions

**Mobile**:
- Day view as default
- Swipe between days
- FAB + click-to-place primary interaction
- Full-screen scheduler UI

## State Management

Following the codebase's established pattern:

```
Schedule/
├── index.tsx          # Component with useReducer
├── Context.ts         # ScheduleContextValue type
├── Provider.tsx       # ScheduleProvider export
├── reducer.ts         # State, actions, reducer
└── useContext.ts      # useScheduleContext hook
```

### State Structure

```typescript
interface ScheduleState {
  templates: TemplateMap;
  currentView: 'day' | 'week' | 'month';
  selectedDate: Date;
  selectedLaneId: string | null;
  dailyGoals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };
  isSchedulerOpen: boolean;
  schedulerPosition: { x: number; y: number; time: Date } | null;
}

type ScheduleAction =
  | { type: 'SET_VIEW'; view: ScheduleState['currentView'] }
  | { type: 'SET_DATE'; date: Date }
  | { type: 'SELECT_LANE'; id: string | null }
  | { type: 'ADD_MEAL_TO_SCHEDULE'; laneId: string; mealId: string; time: Date }
  | { type: 'REMOVE_MEAL_FROM_SCHEDULE'; laneId: string; segmentIndex: number }
  | { type: 'APPLY_LAYOUT'; laneId: string; layout: LayoutOptions }
  | { type: 'SET_DAILY_GOALS'; goals: ScheduleState['dailyGoals'] }
  | { type: 'OPEN_SCHEDULER'; position: ScheduleState['schedulerPosition'] }
  | { type: 'CLOSE_SCHEDULER' };
```

## MVP Feature Priority

### Phase 1 (MVP Core)
- Basic calendar grid (day/week views)
- FAB + click-to-place with inline scheduler UI
- Time picker and template selector
- Simple meal placement (no advanced layout yet)
- Basic nutrition totals display
- LocalStorage persistence

### Phase 2 (Enhanced Features)
- Advanced layout operations (justify, distribute, gaps)
- Goal-based auto-scheduling and suggestions
- Nutrition timeline visualization
- Drag-and-drop meal placement
- Recurring schedule patterns
- Copy/paste days

### Phase 3 (Advanced Features)
- Monthly view with weekly patterns
- Smart scheduling AI (learns preferences)
- Nutrition optimization algorithms
- Conflict resolution suggestions
- Grocery list generation from schedule
- Integration with meal prep planning

## Success Metrics

1. **Scheduling Rate**: Number of days scheduled in advance
2. **Goal Achievement**: Percentage of days meeting nutrition goals
3. **Layout Usage**: Adoption rate of layout presets vs. manual placement
4. **Schedule Stability**: How often users modify schedules after initial creation
5. **Feature Discovery**: Usage of advanced features (IF, auto-schedule, etc.)

## Technical Considerations

### Validation
- Ensure non-overlapping meal times (warn if conflicts)
- Validate nutrition goals are achievable with available templates
- Check lane duration fits within 24 hours
- Prevent circular template references

### Performance
- Lazy-load calendar data (load visible week only)
- Memoize nutrition calculations
- Debounce layout operations
- Use virtual scrolling for large date ranges

### Persistence
- Auto-save on every schedule change
- Store current view and date
- Save daily goals per user
- Export schedule as iCal format (future)

### Accessibility
- Keyboard navigation for calendar (arrow keys)
- Screen reader announcements for meal placement
- Focus management for inline scheduler
- Clear visual feedback for drag operations
