# PRD: Execute - Real-Time Tracking & Guidance

## Overview

The Execute feature provides real-time guidance for following meal schedules throughout the day, tracking completion, and adjusting as needed to meet nutrition goals.

## Goal

Follow the schedule throughout the day, track completion, and adjust as needed while providing clear visibility into remaining variable budget against user-defined goals.

## Philosophy: Data Platform, Not Prescriptive Tracker

The Execute view is a **generic data display platform** that shows whatever variables the user has defined in their templates, tracked against whatever goals they've set. It makes no assumptions about:

- What variables users should track (nutrition, time, cost, or anything else)
- What values are "good" or "bad"
- How variables should be categorized or grouped
- What user behaviors mean or how to interpret them

The system simply:
- Displays consumed vs. goal for user-defined variables
- Shows trajectory (on track, ahead, behind) based on time of day
- Provides a timeline of scheduled activities with completion tracking
- Enables schedule adjustments in real-time

Users bring their own taxonomy, goals, and meaning to the data.

## User Actions

- View today's meal schedule with timing
- Mark meals as completed
- Track actual variable consumption vs. planned goals
- Adjust schedule on-the-fly (swap meals, add unscheduled items)
- View remaining variable budget for the day
- Receive reminders for upcoming meals

## Key Features

### Goal Configuration

Users define daily goals for any variables they want to track:

**Goal Definition Interface**:
- Accessed from Execute view settings or first-time setup
- Shows all variables that appear in user's templates (discovered automatically)
- User sets numeric goal for each variable they want to track
- Variables without goals are not displayed in Execute view
- Goals can be edited anytime
- Per-day goal customization (optional Phase 2 feature)

**Goal Discovery**:
- System scans all templates and lists unique variable names
- Suggests variables that appear frequently across templates
- User selects which variables to set goals for
- No hardcoded variable list - fully dynamic

**Example Goal Configuration**:
```
Available Variables (from your templates):
☐ calories (appears in 15 templates)
☐ protein_g (appears in 15 templates)
☐ prep_time_ms (appears in 12 templates)
☐ cost_cents (appears in 8 templates)
☐ caffeine_mg (appears in 3 templates)

Set your daily goals:
calories: [2000] kcal
protein_g: [150] g
cost_cents: [1500] cents ($15.00)
```

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
- Shows current vs. goal for all tracked variables
- Updates immediately on meal completion
- Color-coded indicators (on track, close, over/under)
- Progress bars for visual feedback
- No interpretation - just data presentation

### Context-Aware Prompts (Optional)
- Generic gap notifications based on math (current vs. goal)
- Time-based context (time remaining in day)
- Considers available templates in library for suggestions
- No prescriptive advice about specific behaviors

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
- Free-form text notes for each meal (optional)
- Daily summary notes field
- No prescribed tracking dimensions (hunger, energy, etc.)
- User can record whatever is relevant to them

## Example User Story

> As a user, I want to see my next scheduled meal in 1 hour, check off meals as I eat them, and see how my actual consumption compares to my daily goals for the variables I'm tracking.

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

### Calculate Consumed Variables

```typescript
// Calculate variable state at current time
function calculateConsumedVariables(
  todayLane: LaneTemplate,
  templates: TemplateMap,
  completedMealIds: Set<string>
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const segment of todayLane.segments) {
    if (completedMealIds.has(segment.busyId)) {
      const meal = templates.get(segment.busyId);
      if (meal && 'willProduce' in meal) {
        // Aggregate all willProduce variables dynamically
        for (const [variableName, value] of Object.entries(meal.willProduce)) {
          totals[variableName] = (totals[variableName] || 0) + (value || 0);
        }
      }
    }
  }

  return totals;
}
```

### Calculate Remaining Budget

```typescript
// Calculate remaining variable budget
function calculateRemainingBudget(
  dailyGoals: Record<string, number>,
  consumed: Record<string, number>
): Record<string, number> {
  const remaining: Record<string, number> = {};

  // For each goal, calculate remaining amount
  for (const [variableName, goalValue] of Object.entries(dailyGoals)) {
    remaining[variableName] = goalValue - (consumed[variableName] || 0);
  }

  return remaining;
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

### Visual Design Specification

**Complete design specification clarified with user on 2026-02-09**

**Mobile-First Design (Priority)**
- **Execute view is the primary mobile interface**
- Optimized specifically for phone usage throughout the day
- Bottom navigation bar access to Execute tab
- 44pt minimum touch targets for all interactive elements
- Large, clear displays for at-a-glance viewing

**Color & Theme**
- Fresh/healthy greens and blues color palette
- Subtle accents (primary colors in key spots, neutral backgrounds)
- Color-coded progress indicators (generic, data-driven):
  - Green: On track (within threshold of goal trajectory for current time)
  - Yellow: Close to trajectory but not perfectly aligned
  - Red: Significantly over or under expected trajectory
  - Thresholds are configurable per user preference
- Auto-detect dark mode following system preference

**Typography**
- Rounded sans-serif font (friendly) - Nunito or Quicksand
- Large countdown timer text (prominent)
- Bold section headers (Macros, Micros, Custom)
- Normal weight for nutrition values
- System font fallback

**Component Styling**
- Flat cards with subtle borders
- Progress bars for nutrition tracking
- Collapsible sections for micros/custom variables
- Comfortable spacing optimized for touch

**Interactions**
- Shadow depth change + border highlight on meal cards
- Quick & snappy animations (fast linear)
- Large tap targets for checkboxes and action buttons
- Satisfying completion animation when checking off meals
- Snackbar notifications for success states (meal completed)

**Empty States**
- Illustration/icon showing no schedule for today
- Call-to-action button to Schedule tab
- Friendly messaging encouraging planning

**Material Design Icons**
- Consistent @mui/icons-material throughout
- Icons for water logging, caffeine tracking, quick actions
- Clear, recognizable symbols

### Header: Next Meal Countdown

**Most Prominent Element**:
```
┌───────────────────────────────────────┐
│  🍳 Next Meal in 1h 23m               │
│                                       │
│  High-Protein Breakfast               │
│  [Variable summary if available]      │
│                                       │
│  [Skip]  [Ate It]  [Reschedule]      │
└───────────────────────────────────────┘
```

**Features**:
- Large countdown timer (hours and minutes)
- Updates every minute
- Meal name from template intent
- Optional variable summary (shows first 1-2 most relevant variables if available)
- Quick action buttons
- Celebration animation when time arrives
- Changes to "Time to eat!" at meal time

### Variable Tracking Display

**Generic Variable Display System**:

The Execute view displays whatever variables exist in the user's templates, without prescribing categories or structure.

**Display Format**:
```
[User-Defined Variable 1]
  current_value / goal_value unit  [=========>  ]

[User-Defined Variable 2]
  current_value / goal_value unit  [======>     ]

[User-Defined Variable 3]
  current_value / goal_value unit  [========>   ]
```

**Variable Display Rules**:
- Show all variables that have goals defined by the user
- Variables without goals are not displayed (or shown in a separate "untracked" section)
- Variable order determined by user preference (configurable) or alphabetical by default
- Each variable shows:
  - Variable name (as defined by user)
  - Current consumed value / Daily goal value
  - Unit (extracted from variable name or user-defined)
  - Progress bar (visual indicator)
  - Color coding based on progress:
    - Green: On track (within 10% of goal at current time of day)
    - Yellow: Close (within 20% but not perfectly on track)
    - Red: Over goal or significantly under trajectory

**Optional Grouping**:
- User can optionally define custom groups (e.g., "Macros", "Hydration", "Time")
- Groups are collapsible sections
- Ungrouped variables appear in a default section
- No hardcoded categories - fully user-controlled

**Empty State**:
- If no goals are defined, show message: "Set daily goals to track progress"
- Link to goals configuration

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
- Common schedule manipulation tasks:
  - 🔄 Swap meal (replace with different template)
  - ➕ Add unscheduled item (quick-add from library)
  - ⏱️ Adjust timing (reschedule meals)
  - ✏️ Edit schedule (navigate to Schedule view)

**Context-Aware Suggestions** (Optional Enhancement):
- Generic gap detection: "You have X variable units remaining"
- Time-based prompts: "Running late? Adjust your schedule?"
- Suggestions based purely on math (current vs. goal), not assumptions about what variables mean
- No prescriptive advice about specific foods or behaviors

### Daily Summary Panel

**End-of-Day View** (after last meal or end of day):
```
┌─────────────────────────────────────┐
│  Today's Summary                    │
│                                     │
│  ✅ All meals completed!            │
│                                     │
│  Actual vs. Planned:                │
│    [Variable 1]    current / goal (±delta)  │
│    [Variable 2]    current / goal (±delta)  │
│    [Variable 3]    current / goal (±delta)  │
│                                     │
│  Notes:                             │
│  [Add notes about today...]         │
│                                     │
│  [Plan Tomorrow]                    │
└─────────────────────────────────────┘
```

**Display Rules**:
- Shows all tracked variables (those with goals)
- Displays actual consumed vs. planned goal with delta
- No judgment or interpretation - just the data
- Optional notes field for user reflection
- Quick link to plan next day's schedule

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
  dailyGoals: Record<string, number>; // User-defined variable goals
  consumed: Record<string, number>; // Current consumed variables
  remaining: Record<string, number>; // Remaining variable budget
  nextMeal: ScheduledMeal | null;
  expandedGroups: Set<string>; // User-defined collapsible groups
  variableOrder: string[]; // User-preferred variable display order
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
- Generic variable tracking display (for all user-defined variables with goals)
- Meal check-off with progress updates
- Today's timeline view
- Real-time budget calculation
- LocalStorage persistence of completed meals and daily goals

### Phase 2 (Enhanced Features)
- Smart meal swap recommendations
- Quick actions (add unscheduled items, adjust timing)
- Notification system for meal reminders
- Daily summary with actual vs. planned
- Free-form notes and logging
- Streak tracking and achievements
- User-defined variable grouping and ordering

### Phase 3 (Advanced Features)
- Predictive suggestions based on patterns
- Integration with wearables (adjust for activity)
- Photo logging of meals
- Voice commands for meal completion
- Weekly/monthly trend analysis
- Social features (share achievements)

## Success Metrics

1. **Meal Completion Rate**: Percentage of scheduled meals checked off
2. **Goal Achievement**: Percentage of days meeting user-defined variable goals
3. **Schedule Adherence**: How closely users follow planned times
4. **Adjustment Rate**: Frequency of on-the-fly swaps and additions
5. **Engagement**: Daily active usage, session duration in Execute view
6. **Goal Setting Rate**: Percentage of users who define daily goals for their variables

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
- Pattern recognition: Learn user's scheduling habits
- Proactive timing suggestions based on historical behavior
- Predictive adjustments: Context-aware rescheduling prompts
- Personalized reminders based on completion patterns

### Data & Integration
- Fitness tracker integration (import activity data as variables)
- Smart watch complications (countdown on wrist)
- Voice assistant integration (mark meals complete)
- Photo logging with optional metadata tagging

### Social Features
- Share daily achievements (variable-agnostic)
- Compete with friends on user-defined goals
- Group challenges based on any tracked variable
- Community support and motivation

### Advanced Tracking
- Free-form correlation tracking (user defines what to correlate)
- Custom data visualization and trend analysis
- Export data for external analysis
- Integration with user's existing tracking tools
