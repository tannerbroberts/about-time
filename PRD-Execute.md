# PRD: Execute - Real-Time Tracking & Guidance

## Overview

The Execute feature provides real-time guidance for following meal schedules throughout the day, tracking completion, and adjusting as needed to meet nutrition goals.

## Goal

Follow the schedule throughout the day, track completion, and adjust as needed while providing clear visibility into remaining nutrition budget.

## User Actions

- View today's meal schedule with timing
- Mark meals as completed
- Track actual nutrition consumption vs. planned
- Adjust schedule on-the-fly (swap meals, add snacks)
- View remaining nutrition budget for the day
- Receive reminders for upcoming meals

## Key Features

### Today View
- Focused view of current day's schedule
- Prioritizes upcoming meals
- Minimizes distractions
- Easy navigation to other days

### Countdown Timers
- Time until next meal
- Prominent, real-time display
- Celebration animation when meal time arrives
- Visual urgency as meal approaches

### Check-Off Interface
- Mark meals as eaten
- Large tap targets for mobile
- Satisfying completion animation
- Undo option for mistakes

### Actual vs. Planned Tracking
- Log deviations from schedule
- Track partial meals (ate half)
- Note substitutions
- Record skipped meals

### Real-Time Budget
- "You have 500 calories and 30g protein remaining"
- Updates immediately on meal completion
- Color-coded indicators (on track, close, over/under)
- Progress bars for visual feedback

### Smart Suggestions
- "Add a protein shake to hit your target"
- Context-aware based on time remaining
- Considers available templates in library
- Learns from user preferences

### Notification System
- Meal reminders (configurable time before)
- Goal tracking alerts ("You're 20g protein short")
- Achievement notifications ("7-day streak!")
- Customizable notification preferences

### Quick Swaps
- Replace scheduled meal with alternative
- Filter by similar nutrition profile
- One-tap swap from meal card
- Updates schedule and nutrition instantly

### Notes & Logging
- Track hunger levels (1-10 scale)
- Energy levels throughout day
- Meal satisfaction ratings
- Optional notes for each meal

## Example User Story

> As a user, I want to see my next scheduled meal in 1 hour, check off meals as I eat them, and know how much protein I still need to hit my daily goal before bedtime.

## Technical Implementation

### CRUD Operations with @tannerbroberts/about-time-core

**All template CRUD operations must use the @tannerbroberts/about-time-core npm package.**

```typescript
import {
  type TemplateMap,
  type BusyTemplate,
  type LaneTemplate,
  updateTemplate,
} from '@tannerbroberts/about-time-core';
```

The Execute feature reads from the TemplateMap and may update templates to track completion state. All state queries and mutations use the about-time-core library.

### Get Today's Schedule

```typescript
// Get today's lane template
function getTodaySchedule(templates: TemplateMap): LaneTemplate | null {
  const today = new Date();
  const todayKey = formatDate(today); // "2024-03-15"

  // Find lane with today's date in intent or metadata
  for (const [id, template] of templates) {
    if (template.type === 'lane' && isScheduledForDate(template, today)) {
      return template as LaneTemplate;
    }
  }

  return null;
}
```

### Calculate Consumed Nutrition

```typescript
// Calculate nutrition state at current time
function calculateConsumedNutrition(
  todayLane: LaneTemplate,
  templates: TemplateMap,
  completedMealIds: Set<string>
): NutritionTotals {
  const totals: NutritionTotals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0
  };

  for (const segment of todayLane.segments) {
    if (completedMealIds.has(segment.busyId)) {
      const meal = templates.get(segment.busyId);
      if (meal && 'willProduce' in meal) {
        totals.calories += meal.willProduce.calories || 0;
        totals.protein_g += meal.willProduce.protein_g || 0;
        totals.carbs_g += meal.willProduce.carbs_g || 0;
        totals.fats_g += meal.willProduce.fats_g || 0;
      }
    }
  }

  return totals;
}
```

### Calculate Remaining Budget

```typescript
// Calculate remaining nutrition budget
function calculateRemainingBudget(
  dailyGoals: NutritionGoals,
  consumed: NutritionTotals
): NutritionTotals {
  return {
    calories: dailyGoals.calories - consumed.calories,
    protein_g: dailyGoals.protein_g - consumed.protein_g,
    carbs_g: dailyGoals.carbs_g - consumed.carbs_g,
    fats_g: dailyGoals.fats_g - consumed.fats_g
  };
}
```

### Get Next Scheduled Meal

```typescript
// Get next scheduled meal
function getNextScheduledMeal(
  todayLane: LaneTemplate,
  templates: TemplateMap,
  currentTime: Date,
  completedMealIds: Set<string>
): ScheduledMeal | null {
  let laneTimeOffset = 0;

  for (const segment of todayLane.segments) {
    const meal = templates.get(segment.busyId);
    if (!meal) continue;

    const mealTime = new Date(todayLane.startTime.getTime() + laneTimeOffset);

    // If this meal hasn't been completed and is upcoming
    if (!completedMealIds.has(segment.busyId) && mealTime > currentTime) {
      return {
        id: segment.busyId,
        time: mealTime,
        meal: meal,
        timeUntil: mealTime.getTime() - currentTime.getTime()
      };
    }

    laneTimeOffset += segment.offset + (meal.estimatedDuration || 0);
  }

  return null;
}
```

## UI/UX Design Specifications

### Header: Next Meal Countdown

**Most Prominent Element**:
```
┌───────────────────────────────────────┐
│  🍳 Next Meal in 1h 23m               │
│                                       │
│  High-Protein Breakfast               │
│  450 cal · 40g protein                │
│                                       │
│  [Skip]  [Ate It]  [Reschedule]      │
└───────────────────────────────────────┘
```

**Features**:
- Large countdown timer (hours and minutes)
- Updates every minute
- Meal name and key macros
- Quick action buttons
- Celebration animation when time arrives
- Changes to "Time to eat!" at meal time

### Nutrition Display: Grouped by Category

**Macros Section** (always visible):
```
Macros
  Calories    1,450 / 2,000 kcal  [=========>  ]
  Protein        98 /   150 g     [======>     ]
  Carbs         165 /   200 g     [========>   ]
  Fats           48 /    65 g     [=======>    ]
```

**Micros Section** (collapsible):
```
Micros ▼
  Fiber          22 /    30 g
  Sodium        890 / 2,300 mg
  Sugar          45 /    50 g
```

**Custom Variables** (collapsible):
```
Custom ▼
  Water         1,200 / 2,000 ml
  Caffeine        200 /   400 mg
```

**Display Format**:
- Variable name (left-aligned)
- Current value / Goal value + unit
- Simple progress bar (visual indicator)
- Color coding:
  - Green: On track (within 10% of goal at current time)
  - Yellow: Close (within 20% but not on track)
  - Red: Over or significantly under
- Grouped sections expand/collapse with smooth animation

### Today's Schedule Timeline

**Vertical Timeline**:
- All meals for today listed vertically
- Time displayed on left (12:00 PM)
- Meal card on right with nutrition summary
- Current time indicator line
- Checkboxes to mark meals complete
- Past/present/future visual distinction

**Meal Card States**:
- **Completed**: Grayed out, checkbox checked, collapse to minimal
- **Current/Upcoming**: Full color, prominent, checkbox enabled
- **Missed**: Orange/red highlight, "Mark as skipped?" prompt
- **Future**: Normal state, checkbox disabled until time approaches

**Interactions**:
- Tap meal card to expand details
- Swipe to quick swap with alternative
- Long-press for additional options (edit, skip, reschedule)
- Tap checkbox to mark complete (with confirmation animation)

### Quick Actions Section

**Floating Action Menu**:
- Compact button row or expandable FAB
- Common tasks easily accessible:
  - 💧 Log water
  - ☕ Log caffeine
  - 🔄 Swap meal
  - ➕ Add snack
  - ⏱️ Adjust timing

**Context-Aware Suggestions**:
- "Add 200ml water to hit daily goal"
- "You're 30g protein short - add a protein shake?"
- "Running late? Push dinner back 30 minutes?"
- Appears based on nutrition gaps and time context

### Daily Summary Panel

**End-of-Day View** (after last meal):
```
┌─────────────────────────────────────┐
│  Today's Summary                    │
│                                     │
│  ✅ All meals completed!            │
│                                     │
│  Actual vs. Planned:                │
│    Calories    2,050 / 2,000 (+50)  │
│    Protein       155 /   150 (+5g)  │
│    Carbs         198 /   200 (-2g)  │
│    Fats           67 /    65 (+2g)  │
│                                     │
│  Notes:                             │
│  [Add notes about today...]         │
│                                     │
│  [Plan Tomorrow]                    │
└─────────────────────────────────────┘
```

## State Management

Following the codebase's established pattern:

```
Execute/
├── index.tsx          # Component with useReducer
├── Context.ts         # ExecuteContextValue type
├── Provider.tsx       # ExecuteProvider export
├── reducer.ts         # State, actions, reducer
└── useContext.ts      # useExecuteContext hook
```

### State Structure

```typescript
interface ExecuteState {
  templates: TemplateMap;
  todayLaneId: string | null;
  completedMealIds: Set<string>;
  skippedMealIds: Set<string>;
  currentTime: Date;
  dailyGoals: NutritionGoals;
  consumed: NutritionTotals;
  remaining: NutritionTotals;
  nextMeal: ScheduledMeal | null;
  expandedSections: {
    macros: boolean;
    micros: boolean;
    custom: boolean;
  };
  notifications: {
    enabled: boolean;
    reminderMinutes: number;
  };
  notes: string;
}

type ExecuteAction =
  | { type: 'LOAD_TODAY'; laneId: string }
  | { type: 'COMPLETE_MEAL'; mealId: string }
  | { type: 'UNCOMPLETE_MEAL'; mealId: string }
  | { type: 'SKIP_MEAL'; mealId: string }
  | { type: 'SWAP_MEAL'; oldMealId: string; newMealId: string }
  | { type: 'UPDATE_CURRENT_TIME'; time: Date }
  | { type: 'TOGGLE_SECTION'; section: keyof ExecuteState['expandedSections'] }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'RECALCULATE_NUTRITION' };
```

## MVP Feature Priority

### Phase 1 (MVP Core)
- Next meal countdown display
- Grouped nutrition tracking (Macros/Micros/Custom)
- Meal check-off with progress updates
- Today's timeline view
- Real-time budget calculation
- LocalStorage persistence of completed meals

### Phase 2 (Enhanced Features)
- Smart meal swap recommendations
- Quick actions (add snack, log water)
- Notification system for meal reminders
- Daily summary with actual vs. planned
- Notes and logging (hunger, energy, satisfaction)
- Streak tracking and achievements

### Phase 3 (Advanced Features)
- Predictive suggestions based on patterns
- Integration with wearables (adjust for activity)
- Photo logging of meals
- Voice commands for meal completion
- Weekly/monthly trend analysis
- Social features (share achievements)

## Success Metrics

1. **Meal Completion Rate**: Percentage of scheduled meals checked off
2. **Goal Achievement**: Percentage of days meeting nutrition goals
3. **Schedule Adherence**: How closely users follow planned times
4. **Adjustment Rate**: Frequency of on-the-fly swaps and additions
5. **Engagement**: Daily active usage, session duration in Execute view

## Technical Considerations

### Real-Time Updates
- Update countdown timer every minute
- Recalculate nutrition on meal completion
- Update next meal when current meal passed
- Use React hooks for time-based rendering

### Performance
- Memoize nutrition calculations
- Lazy-load meal details
- Optimize list rendering (virtualization if many meals)
- Cache computed values (remaining budget)

### Persistence
- Save completed meal IDs to LocalStorage
- Persist notes for each day
- Store notification preferences
- Sync with server (future)

### Notifications
- Web Push API for meal reminders
- Request permission on first use
- Configurable timing (5/15/30 minutes before)
- Snooze functionality

### Accessibility
- Clear labels for all interactive elements
- High contrast for color-blind users
- Screen reader support for countdown and progress
- Keyboard navigation for all actions

## Future Enhancements

### AI & Intelligence
- Proactive suggestions: "You usually have a snack around 3pm"
- Pattern recognition: "You skip breakfast on weekends"
- Predictive adjustments: "Traffic delay? Suggest rescheduling"
- Personalized reminders based on habits

### Data & Integration
- Fitness tracker integration (adjust for exercise)
- Smart watch complications (countdown on wrist)
- Voice assistant integration ("Alexa, mark breakfast complete")
- Photo logging with AI nutrition estimation

### Social Features
- Share daily achievements
- Compete with friends on goals
- Group challenges (7-day protein challenge)
- Community support and motivation

### Advanced Tracking
- Hunger/fullness scale tracking
- Energy level correlation with meals
- Mood tracking and nutrition relationship
- Sleep quality and nutrition patterns
