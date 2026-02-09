# Product Requirements Document: About Time - Nutrition Scheduling

## Executive Summary

About Time is a nutrition-centric calendaring application that takes the cognitive load out of meal planning and execution. Using the about-time-core template system, it enables users to **Build**, **Schedule**, and **Execute** nutrition behaviors through a structured, reusable template approach.

## Core Philosophy

Traditional meal planning requires constant decision-making: "What should I eat?", "When should I eat?", "Did I get enough protein today?". About Time removes this mental overhead by transforming nutrition behaviors into executable templates that can be composed, scheduled, and tracked automatically.

## About-Time-Core Integration

The application leverages the about-time-core library's template system:

- **BusyTemplate**: Represents atomic nutrition activities (meals, snacks) with:
  - `intent`: Meal description (e.g., "High-protein breakfast")
  - `estimatedDuration`: Time to prepare and consume
  - `willConsume`: Resources needed (time, money, ingredients)
  - `willProduce`: Nutritional output (calories, protein, carbs, fats, fiber, etc.)

- **LaneTemplate**: Represents time-based sequences (daily schedules, meal prep sessions) with:
  - `segments`: Collection of meals/activities with timing offsets
  - Layout operations: Pack meals, distribute evenly, insert gaps (eating windows)

- **State Ledger System**: Track nutrition variables across templates:
  - Macros: protein, carbs, fats, calories
  - Micros: fiber, sodium, vitamins
  - Custom: water intake, caffeine, supplements

## Three Core User Behaviors

### 1. BUILD - Template Creation & Management

**TODO**: See [PRD-Build.md](./PRD-Build.md) for complete Build feature specification.

**Summary**: Create and manage reusable meal templates with complete nutritional profiles using manual form-based creation and a filterable template library interface.

---

### 2. SCHEDULE - Calendar Planning & Layout

**TODO**: See [PRD-Schedule.md](./PRD-Schedule.md) for complete Schedule feature specification.

**Summary**: Arrange meal templates into daily/weekly schedules using FAB + click-to-place interaction, layout operations, and goal-based scheduling to meet nutrition targets.

---

### 3. EXECUTE - Real-Time Tracking & Guidance

**TODO**: See [PRD-Execute.md](./PRD-Execute.md) for complete Execute feature specification.

**Summary**: Follow the schedule throughout the day with next meal countdown, grouped nutrition tracking, meal check-off, and real-time budget updates.

---

## UI/UX Design Specifications

### Visual Design Specification

**Complete design specification clarified with user on 2026-02-09**

#### Navigation Structure

**Mobile-First Design**
- Application optimized for phone usage (especially Execute view)
- Bottom navigation bar with three tabs: **Build** | **Schedule** | **Execute**
- Active tab has filled background color
- Standard 44pt minimum touch targets (Apple HIG standard)
- Responsive across mobile, tablet, and desktop

#### Color & Theme

**Color Palette**
- **Primary colors**: Fresh/healthy greens and blues
- **Application**: Subtle accents (primary colors in key spots, mostly neutral backgrounds)
- **Template colors**: User-assigned per template (custom color chosen by user or auto-assigned)
- **Theme support**: Auto-detect dark mode following system preference

#### Typography

**Font Style**
- **Headings & UI**: Rounded sans-serif (friendly) - import Nunito or Quicksand
- **Form labels**: Bold weight
- **Input fields**: Normal weight
- **Base fallback**: System fonts (-apple-system, Segoe UI, Roboto, etc.)

#### Component Styling

**Cards & Containers**
- **Template cards**: Flat with subtle borders
- **Modals on mobile**: Full-screen takeover
- **Modal backdrop**: Solid color (opaque background)
- **Spacing**: Comfortable density (balanced spacing, good for touch targets)

**Icons**
- **Style**: Material Design icons (@mui/icons-material)
- **Usage**: Consistent with MUI component library

#### Interactions & States

**Interactive Elements**
- **Hover/Focus states**: Shadow depth change + border highlight
- **Animations**: Quick & snappy (fast linear animations)
- **Touch targets**: 44pt minimum for all interactive elements

**Feedback States**
- **Form validation errors**: Inline below field with red text
- **Success messages**: Snackbar notification (brief toast at bottom/top)
- **Empty states**: Illustration/icon + call-to-action button

#### Template-Specific Components

**Library & Filtering**
- **Filter system**: Always-visible filter inputs with "save filter" button at bottom
- **Filter picker**: Filter name dropdown at top to select pre-saved filters
- **Filters**: Saved permanently, shared across application, selection saved per context
- **Library display**: Shown in modals, filtered by context (e.g., duration constraints)

**Nutrition Display**
- **Template cards**: Variable count indicator
  - Shows number of variables on BusyTemplate
  - If single variable: show name and numerical value
  - Don't sum variables, just indicate count

**Hierarchy Viewer (Template Editor)**
- **Visual style**: Colored blocks with nesting levels showing time and depth
- **Time axis**: Continuous ruler with time labels (0min, 5min, 10min, etc.)
- **Empty space**: Dashed outline region showing placement areas
- **Breadcrumbs**: Horizontal with arrows (A → B → C → D)
- **Vertical space**: Level depth clamp set by user with "+X" indicators above segments that have additional clamped levels
- **Change impact visualization**:
  - Pulse/flash animation on affected instances
  - Badge showing count ("5 of 50")
  - Outline/border on affected segments

### 1. BUILD Section UI

**Template Library Display**
- **Shown in modal dialogs**, context-aware
- Flat cards with subtle borders
- Each card shows:
  - Template name (bold, rounded sans-serif font)
  - Variable count indicator (or single variable name + value)
  - Template type badge (Busy/Lane)
  - User-assigned color for identification
- Advanced filter system:
  - Always-visible filter inputs
  - Filter name picker dropdown at top
  - "Save filter" button at bottom
  - Filters saved permanently, selection per context
- Comfortable spacing, 44pt touch targets

**Template Creation Interface**
- **Manual form-based creation** as primary method
- Full-screen modal on mobile
- Form fields:
  - Basic Info: Name (required), Duration (required), Description
  - Macros: Calories, Protein, Carbs, Fats
  - Micros: Fiber, Sodium, Sugar (optional)
  - Resources: Prep Time, Cost
- Bold labels, normal weight inputs
- Inline error messages below fields (red text)
- Iterative refinement approach:
  - Start with basic template (name + duration)
  - Add details progressively
  - Save at any stage
- Snackbar notification on successful save

**Template Editor (Hierarchy Viewer)**
- Full-screen modal interface on mobile
- Two regions: Hierarchy Viewer + Properties Panel
- Colored blocks showing time and nesting depth
- Continuous ruler with time labels
- Breadcrumb lineage path (A → B → C)
- Change impact visualization (pulse/flash + badge)
- Dashed outline for empty segment spaces
- Level depth clamp with "+X" indicators
- Real-time validation feedback

### 2. SCHEDULE Section UI

**Primary Interface**
- Iterative design approach (start simple, refine together)
- Initial implementation: Clean calendar base
- Will evolve based on user feedback

**FAB + Inline Scheduler Flow**

1. **Floating Action Button (FAB)**
   - Large, colorful "+" button (bottom-right corner)
   - Primary action: Add meal to schedule
   - Pulse animation when schedule is empty

2. **Click Schedule to Place**
   - User clicks desired time/day on calendar
   - Opens inline scheduler UI at click location
   - Contextual placement (appears near click point)

3. **Inline Scheduler UI** (appears on click):
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
   - **Time Picker**: Hour/minute selection + duration
   - **Quick Nutrition Summary**: Shows how this meal affects daily totals
   - **Layout Options**: Radio buttons for insertion behavior
   - Compact, focused UI - doesn't obscure calendar
   - Keyboard navigation supported (ESC to close, Enter to confirm)

**Calendar Base**
- Visual representation of days and time slots
- Existing meals shown as colored blocks
- Click interaction zones clear and large
- Responsive to different screen sizes

### 3. EXECUTE Section UI

**Header: Next Meal Countdown** (most prominent)
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
- Large countdown timer (hours and minutes)
- Meal name and key macros
- Quick action buttons at bottom
- Updates in real-time
- Celebration animation when time arrives

**Nutrition Display: Grouped by Category**

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
- Color coding: green (on track), yellow (close), red (over/under)
- Grouped sections can expand/collapse

**Today's Schedule Timeline**
- Vertical timeline of all meals
- Current time indicator line
- Checkboxes to mark meals complete
- Completed meals grayed out
- Upcoming meals highlighted
- Past missed meals flagged

**Quick Actions Section**
- Floating action menu for common tasks:
  - Add snack
  - Log water
  - Swap meal
  - Adjust timing
- Context-aware suggestions based on nutrition gaps

### Interaction Patterns

**Meal Check-Off**
- Large tap targets for mobile
- Satisfying animation on completion
- Undo option appears briefly
- Updates nutrition totals immediately

**Responsive Design (Mobile-First)**
- **Mobile (Primary)**: Single column, bottom navigation bar, full-screen modals, swipe gestures, optimized touch targets (44pt minimum)
- **Tablet**: Adapted mobile layout with more spacing, some modals become overlays
- **Desktop**: Expanded layouts with side panels, hover states more prominent

**Loading States**
- Skeleton screens for content loading
- Optimistic UI updates (assume success, rollback on error)
- Clear error messages with recovery actions

**Empty States**
- Illustration or icon showing context (no templates, no schedule, etc.)
- Call-to-action button for primary action
- Friendly, approachable messaging
- Material Design icons for visual clarity

### Animation & Transitions

**Animation Style**: Quick & snappy (fast linear animations)

**Key Animations**:
- Tab switching (quick slide transition)
- Meal card entry/exit (fast scale + fade)
- Countdown number updates (snap change)
- Progress bar fills (linear ease)
- Change impact visualization (pulse/flash on affected instances)
- Success feedback (brief snackbar, no elaborate celebrations)
- Modal open/close (fast fade/slide)

**Performance**:
- 60fps target for all animations
- Reduced motion support for accessibility
- Hardware acceleration for transforms
- Fast, efficient animations prioritized over elaborate effects

---

## Data Model

### State Variables (StateLedger)

**Macronutrients**:
- `calories`: Total energy (kcal)
- `protein_g`: Protein (grams)
- `carbs_g`: Carbohydrates (grams)
- `fats_g`: Fats (grams)

**Micronutrients** (optional):
- `fiber_g`: Dietary fiber (grams)
- `sodium_mg`: Sodium (milligrams)
- `sugar_g`: Sugars (grams)
- Custom vitamins/minerals

**Time & Cost**:
- `prep_time_ms`: Preparation time (milliseconds)
- `consume_time_ms`: Eating time (milliseconds)
- `cost_cents`: Monetary cost (cents)

**Custom Variables**:
- `water_ml`: Water intake (milliliters)
- `caffeine_mg`: Caffeine (milligrams)
- Users can define custom tracking variables

### Template Hierarchy

```
WeeklySchedule (LaneTemplate)
├── Monday (LaneTemplate)
│   ├── Breakfast (BusyTemplate)
│   ├── Lunch (BusyTemplate)
│   └── Dinner (LaneTemplate)
│       ├── Salad (BusyTemplate)
│       └── Main Course (BusyTemplate)
├── Tuesday (LaneTemplate)
│   └── ...
└── ...
```

## User Interface Overview

The application consists of three main sections accessible via a top tab bar:

### 1. BUILD Section
- **Filterable template library** with advanced filter system
- **Manual form-based creation** with progressive refinement
- Context-aware library display (modal-based)
- Hierarchy viewer for template composition
- Template management and organization

### 2. SCHEDULE Section
- **FAB + click-to-place** interaction pattern
- **Inline scheduler UI** with time picker, template selector, impact preview, and layout options
- Visual calendar interface (iterative design approach)
- Layout controls and presets

### 3. EXECUTE Section
- **Next meal countdown** as primary focus
- **Grouped nutrition display** (Macros → Micros → Custom variables)
- Today's timeline with completion tracking
- Quick actions and adjustments

**See "UI/UX Design Specifications" section above for detailed mockups, interaction patterns, and visual design system.**

## Technical Architecture

### State Management Pattern

Following the codebase's established pattern:

```
Build/
├── index.tsx          # Component with useReducer
├── Context.ts         # BuildContextValue type
├── Provider.tsx       # BuildProvider export
├── reducer.ts         # State, actions, reducer
└── useContext.ts      # useBuildContext hook

Schedule/
├── index.tsx
├── Context.ts
├── Provider.tsx
├── reducer.ts
└── useContext.ts

Execute/
├── index.tsx
├── Context.ts
├── Provider.tsx
├── reducer.ts
└── useContext.ts
```

### Integration with about-time-core

```typescript
import {
  type TemplateMap,
  type BusyTemplate,
  type LaneTemplate,
  createBusyTemplate,
  createLaneTemplate,
  updateTemplate,
  deleteTemplate,
  applyLaneLayout,
  addSegmentToEnd,
  visualizeLane
} from '@tannerbroberts/about-time-core';
```

### AI Implementation Strategy

**Core Philosophy**: AI should reduce cognitive load, not replace user control. Every AI suggestion is editable and transparent.

**Template Creation Flow**:

1. **Natural Language Input**
   - User types: "Greek yogurt bowl with berries and granola"
   - AI parses meal description

2. **AI Nutrition Estimation**
   - Query nutrition API or LLM with structured prompt
   - Return estimated macros, prep time, cost
   - Show confidence level (high/medium/low)

3. **User Review & Override**
   - Display AI suggestions in editable form fields
   - User can adjust any value
   - "Looks good?" confirmation or "Let me edit" option

4. **Template Saved**
   - Create BusyTemplate with final values
   - Add to user's library
   - Track which fields were AI-generated vs. user-edited (for learning)

**Technical Implementation Options**:

**Option A: LLM API (Recommended for MVP)**
```typescript
async function estimateNutrition(description: string): Promise<NutritionEstimate> {
  const prompt = `
Given this meal description: "${description}"

Estimate the nutrition information in JSON format:
{
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "fiber_g": number,
  "prepTime_minutes": number,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}
`;

  const response = await callLLM(prompt);
  return JSON.parse(response);
}
```

**Option B: Nutrition Database API**
- Use services like USDA FoodData Central, Nutritionix, or Spoonacular
- Parse meal description into ingredients
- Look up each ingredient
- Sum totals
- More accurate but requires ingredient parsing

**Option C: Hybrid Approach**
- Use LLM to parse ingredients
- Use nutrition database for lookup
- Use LLM to handle ambiguity and portion estimation
- Best accuracy, more complex

**AI Features for Future Phases**:
- **Meal planning**: "Plan my week for 2000 cal/day, high protein"
- **Smart scheduling**: Learns user patterns, suggests meal times
- **Substitutions**: "Make this vegan" or "Lower the carbs"
- **Batch suggestions**: "What can I meal prep on Sunday?"

**Error Handling**:
- Always provide manual entry option if AI fails
- Clear error messages: "Couldn't estimate nutrition, please enter manually"
- Fallback to defaults (reasonable estimates) with clear labeling
- Allow user to report incorrect AI suggestions for improvement

### Persistence Layer

- LocalStorage for MVP (TemplateMap serialization)
- Future: Backend API for sync across devices
- Export/Import functionality for backup

## Success Metrics

1. **Build Phase**: Number of templates created per user
2. **Schedule Phase**: Number of days scheduled in advance
3. **Execute Phase**: Meal completion rate, goal achievement rate
4. **Retention**: Daily active usage, weekly schedule creation

## MVP Feature Priority

### Development Philosophy
- **Iterative approach**: Build basic functionality first, refine based on usage
- **AI-first**: Integrate AI assistance early in template creation
- **User feedback driven**: Evolve UI patterns based on actual interaction
- **Progressive enhancement**: Start minimal, add complexity as needed

### Phase 1 (MVP Core)
**Build Section**:
- Manual form-based template creation
- Advanced filter system with save/load functionality
- Context-aware library display in modals
- Hierarchy viewer for template composition
- LocalStorage persistence

**Schedule Section**:
- Basic calendar grid (day/week views)
- FAB + click-to-place with inline scheduler UI
- Time picker and template selector
- Simple meal placement (no advanced layout yet)

**Execute Section**:
- Next meal countdown display
- Grouped nutrition tracking (Macros/Micros/Custom)
- Meal check-off with progress updates
- Today's timeline view

**Theme & Navigation**:
- Bottom navigation bar (mobile-first)
- Auto-detect dark mode
- Fresh/healthy greens and blues with subtle accents
- Rounded sans-serif typography
- Material Design icons

### Phase 2 (Enhanced Features)
- Advanced layout operations (justify, distribute, gaps)
- Goal-based auto-scheduling and suggestions
- Template variants and composition
- Nutrition timeline visualization
- Smart meal swap recommendations
- Notification system for meal reminders

### Phase 3 (Social & Intelligence)
- Template sharing community
- Recipe database integration
- Advanced AI meal planning (weekly optimization)
- Grocery list generation
- Advanced analytics and insights
- Mobile app (React Native)
- Fitness tracker integration

## Technical Considerations

### Validation
- Use about-time-core validation functions
- Ensure non-overlapping segments
- Validate nutrition goals are achievable
- Check template relationships for circular references

### Performance
- TemplateMap uses O(1) lookups
- Mutations are in-place for performance
- Use structuredClone for immutable snapshots when needed
- Lazy-load template visualizations

### Accessibility
- Keyboard navigation for all interactions
- Screen reader support for nutrition data
- High contrast mode for visibility
- Focus management for modal dialogs

## Future Enhancements

### AI & Intelligence
- **Conversational meal planning**: "Plan my week for 2000 calories and high protein"
- **Learning preferences**: AI learns favorite meals, timing patterns, macro preferences
- **Smart substitutions**: "Replace this with a vegan option" or "Make this lower carb"
- **Proactive suggestions**: "You usually have a snack around 3pm, want to add one today?"
- **Photo nutrition estimation**: Take photo of meal → AI estimates macros
- **Recipe import**: Paste recipe URL → AI extracts nutrition data

### Data & Integration
- Integration with fitness trackers (adjust calories based on activity)
- Grocery list generation from scheduled meals
- Barcode scanning for packaged foods
- Restaurant meal database integration
- Meal prep optimization (batch cooking suggestions)

### Social Features
- Share schedules and meal plans with friends
- Follow other users' public templates
- Community recipe database
- Nutrition challenges and group goals

### Advanced Features
- Weekly nutrition trend analysis
- Meal timing optimization (circadian rhythm)
- Budget tracking and meal cost optimization
- Ingredient inventory management
- Macro cycling support (high/low carb days)
