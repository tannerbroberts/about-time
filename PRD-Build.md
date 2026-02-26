# PRD: Build - Template Creation & Management

## Overview

The Build feature enables users to create and manage reusable meal templates with complete nutritional profiles using the about-time-core template system.

## Goal

Create reusable meal templates with complete nutritional profiles that can be scheduled and tracked.

## Happy Path Integration

The Build feature is the foundation of the About Time user journey (see [HAPPY-PATH.md](./HAPPY-PATH.md)). It enables users to:

1. **Record recipes found online**: Capture food variables consumed (ingredients) and produced (nutrition) from any source
2. **Build personal taxonomy**: Create custom variable names and organization systems that match their goals and lifestyle
3. **Compose complex templates**: Build meal prep sessions and routines using composition and nested templates
4. **Access nested variables**: View aggregate nutrition across all segments when planning meal prep or daily schedules
5. **Apply layout functions**: Use helper buttons to efficiently organize segments with about-time-core layout operations

**Key Features Supporting Happy Path**:
- User-defined variable names (support for any taxonomy)
- Nested variable summaries (see totals across all segments)
- Layout helper functions (Pack, Distribute, Eating Window, etc.)
- Template composition (LaneTemplates containing BusyTemplates)
- Hierarchy viewer with recursive expansion

## User Actions

- Create BusyTemplates for individual meals/snacks
- Define nutritional production (macros, micros, custom variables)
- Specify consumption requirements (prep time, ingredients, cost)
- Build LaneTemplates for meal sequences (meal prep sessions, daily routines)
- Compose nested templates (breakfast routine with multiple components)

## Key Features

### Meal Template Library
- Browse, search, and organize saved meal templates
- Dense template rows in list format
- Sort by Recent, Name, Calories, Protein
- Scroll performance optimized for hundreds of templates

### Quick Entry
- Form-based manual entry as primary method
- Pre-filled defaults for common values
- Field validation and error feedback
- Save templates at any stage of completion

### Template Composition
- Nest templates (e.g., "Sunday Meal Prep" contains multiple meal templates)
- Create complex meal sequences
- Reuse components across templates

### Variants
- Create variations of templates (low-carb version, vegan version)
- Quick duplication with modifications
- Track template relationships

### Import/Export
- Share templates with other users
- Import from recipe databases
- Export for backup
- JSON-based template format

## Example User Story

> As a user, I want to create a "High-Protein Breakfast" template that produces 40g protein and 450 calories, takes 10 minutes to prepare, and can be scheduled into my morning routine.

## Technical Implementation

### CRUD Operations with @tannerbroberts/about-time-core

**All template CRUD operations must use the @tannerbroberts/about-time-core npm package.**

```typescript
import {
  type TemplateMap,
  type BusyTemplate,
  type LaneTemplate,
  createBusyTemplate,
  createLaneTemplate,
  updateTemplate,
  deleteTemplate,
} from '@tannerbroberts/about-time-core';
```

The package provides:
- **Create**: `createBusyTemplate()`, `createLaneTemplate()`
- **Read**: Direct access via `TemplateMap.get(id)`
- **Update**: `updateTemplate()` for modifying existing templates
- **Delete**: `deleteTemplate()` for removing templates

### BusyTemplate Structure

```typescript
createBusyTemplate({
  intent: "High-Protein Breakfast - Greek yogurt with berries",
  estimatedDuration: 10 * 60 * 1000, // 10 minutes
  willConsume: {
    prep_time_ms: 10 * 60 * 1000,
    cost_cents: 350
  },
  willProduce: {
    calories: 450,
    protein_g: 40,
    carbs_g: 35,
    fats_g: 15,
    fiber_g: 8
  }
}, templates, generateId);
```

### Manual Entry Flow

**Template Creation Flow**:

1. **Basic Information**
   - User enters template name (required)
   - User sets duration (required)
   - Optional description field

2. **Nutrition Values**
   - All fields optional
   - Numeric inputs with validation
   - Clear units displayed (g, mg, kcal, etc.)
   - Helpful hints: "Typical breakfast: 300-500 calories"

3. **Resources & Cost**
   - Prep time (optional, milliseconds)
   - Cost estimate (optional, cents)
   - Any custom variables user wants to track

4. **Template Saved**
   - Create BusyTemplate with entered values
   - Add to user's library
   - Can be edited anytime

**Validation**:
- Required: name, duration (must be > 0)
- Optional: all nutrition fields
- Numeric validation for all quantity fields
- Clear error messages with field highlighting

## UI/UX Design Specifications

### UI Layering and Z-Index Conventions

To ensure proper stacking order and prevent visual conflicts, follow these z-index levels:

**Z-Index Layers** (from bottom to top):
- **Base content**: z-index 0 (default, no explicit z-index needed)
- **Sticky headers/footers**: z-index 100-200
- **Overlays and floating menus**: z-index 1300-1400
  - Backdrop: 1300
  - Floating pill/menu: 1400
- **Dialogs and modals**: z-index 1500+
  - Should always appear above overlays and floating menus
  - MUI Dialog default is 1300, explicitly set to 1500 when needed

**Example Implementation**:
```typescript
// SegmentAddOverlay (floating menu)
<Box sx={{ zIndex: 1300 }}>  {/* Backdrop */}
<Paper sx={{ zIndex: 1400 }}>  {/* Floating pill */}

// FillWithNewModal (dialog triggered from overlay)
<Dialog sx={{ zIndex: 1500 }}>  {/* Must be above the overlay */}
```

**Rule**: Any modal/dialog opened FROM an overlay must have a higher z-index than the overlay itself.

### Template Library Display

**Dense template rows** in list format:
- Template name (bold, prominent)
- Quick macro summary (calories, protein, carbs, fats)
- Template type badge (Busy/Lane)
- Quick action buttons (edit, duplicate, delete)
- Search bar at top with live filtering
- Sort options: Recent, Name, Calories, Protein
- Scroll performance optimized for hundreds of templates

### Template Creation Interface

**IMPORTANT: Template Type Selection Pattern**:

The template type (Busy vs Lane) MUST be determined BEFORE opening the creation form, never inside the form itself.

**Required Pattern**:
- Two separate action buttons/triggers: one for creating a Busy template, one for creating a Lane template
- Each button opens the form with the type pre-determined
- The form itself NEVER shows template type selection UI
- This pattern applies to ALL template creation entry points:
  - Library empty state: Two separate "Create Busy Template" and "Create Lane Template" buttons
  - Library SpeedDial: Two separate SpeedDial actions
  - SegmentAddOverlay: Two separate icon buttons in the pill menu
  - Any future template creation UI

**Rationale**:
- Reduces cognitive load by separating the "what kind?" decision from the "what details?" task
- Makes the form cleaner and more focused on the template's actual properties
- Matches the mental model: users know whether they want a container (Lane) or an activity (Busy) before they start entering details
- Consistent with existing UI patterns in Library and EmptyState

**Implementation**:
```typescript
// ✅ Correct: Type determined before form opens
const handleCreateBusyClick = (): void => {
  openTemplateForm(undefined, 'busy');
};

const handleCreateLaneClick = (): void => {
  openTemplateForm(undefined, 'lane');
};

// ❌ Incorrect: Type selection inside the form
<Stack direction="row" spacing={1}>
  <Button onClick={() => setTemplateType('busy')}>Busy</Button>
  <Button onClick={() => setTemplateType('lane')}>Lane</Button>
</Stack>
```

**Manual Form-Based Creation**:
- Structured form with clear field labels
- Required fields: Name, Duration
- Optional nutrition fields with sensible defaults
- Iterative refinement approach:
  - Start with basic template (name + duration)
  - Add nutrition details progressively
  - Save at any stage
- Field groupings:
  - Basic Info: Name, Duration, Description
  - Macros: Calories, Protein, Carbs, Fats
  - Micros: Fiber, Sodium, Sugar (optional)
  - Resources: Prep Time, Cost

## Template Building/Editing Interface

### Core Concepts

**Templates as Functions**:
Templates behave like JavaScript functions:
- The template **definition** is never altered by "running" (scheduling) the template
- Templates can be invoked/scheduled independently or nested within other templates
- Scheduling a template recursively schedules all its segments
- Changes to a template definition affect ALL instances that reference it

**Composition & Nesting**:
- Templates contain **segments** - references to other templates with time offsets
- Segments are NOT inline blocks; they're references to template definitions
- Creating nested structures: Template A → segments of B → segments of C → etc.
- Unlimited nesting depth with full recursive expansion

### Visual Layout System

**Two-Axis Layout**:
- **Horizontal axis**: Time offset within the template (left to right)
- **Vertical axis**: Nesting depth (bottom to top)
- Base template: Full width at bottom
- Nested segments: Stacked higher, positioned by their offset

**Recursive Expansion Visualization**:
Creates a pyramid/tree effect showing compositional structure:
```
Example: A holds 2×B, B holds 2×C, C holds 2×D, D holds 1×E

Visual Result:
[E][E][E][E][E][E][E][E]  ← 8 E templates (highest)
[D][D][D][D][D][D][D][D]  ← 8 D templates
[C] [C] [C] [C]           ← 4 C templates
[B]     [B]               ← 2 B templates
[A (base template)]       ← 1 A template (full width, base)
```

**Exponential Expansion**:
- Adding one E to D results in 16 total E instances visible
- All instances update simultaneously when definition changes
- Creates visual understanding of template composition scale

### Two-Region Editing Interface

**Region 1: Hierarchy Viewer**
- Shows breadcrumb path for lineage-based selection
- Displays recursive template structure with visual nesting
- Highlights focused element and affected instances
- Shows full compositional tree from base template

**Region 2: Properties Panel** (for focused element)
Editable properties:
- **Common**: name, color, duration, offset (if segment)
- **BusyTemplate**: variable names and quantities (willProduce, willConsume)
- **LaneTemplate**: layout rules
- **Inheritance**: color and background pattern (inherited from base layer)
- **Variables Section**:
  - **Template Variables**: Variables declared directly in the focused template
    - Editable for BusyTemplates (willProduce, willConsume)
    - Display-only for LaneTemplates (no direct variables)
  - **Nested Variables Summary**: Aggregated variables from all child segments
    - Recursive calculation across all nested segments
    - Read-only display (e.g., "Total: 180g protein across 3 segments")
    - Grouped by variable name with units
    - Updates automatically when segments change
    - Shows both willProduce and willConsume totals separately
- **Layout Helper Functions** (for LaneTemplates only):
  - Visual buttons to apply about-time-core layout functions:
    - **Pack Tightly**: `applyLaneLayout(laneId, templates, { justifyContent: 'flex-start', gap: 0 })`
    - **Distribute Evenly**: `applyLaneLayout(laneId, templates, { justifyContent: 'space-evenly' })`
    - **Add Gap**: Opens gap size input, then applies with specified gap
    - **Eating Window**: Opens start/end time inputs for intermittent fasting layout
    - **Fit to Content**: `fitLaneDurationToLast(laneId, templates)`
  - All functions update the focused template immediately
  - Changes propagate to all visible instances via Zustand
  - Visual feedback shows layout application in real-time
- **Actions**:
  - Add segment (see workflow below)
  - Delete segment (only visible for segments, NOT base templates)
  - Duplicate template (creates new record with different name)

### Focused Element System

**"Focused" Concept**:
- Either the base template OR a segment within it
- Determines what shows in properties panel
- Affects which segments can be added/removed

**Critical Distinction: Focused Element vs Base Template**:
- **Base Template**: The root template opened in the editor (first item in focusedLineage, always has `offset: undefined`)
- **Focused Element**: The currently selected item in the hierarchy (last item in focusedLineage)
- **UI Affordances**: All properties panel interactions (layout buttons, variable displays, editing) reference the FOCUSED element, not necessarily the base template
- **Example**: If lineage is `[{ templateId: 'A' }, { templateId: 'B', offset: 60000 }]`, the focused element is B (even though A is the base)

This means:
- Layout buttons operate on the focused LaneTemplate's segments
- Variable summaries aggregate the focused template's nested segments
- Property edits modify the focused template's definition
- Changes propagate to all instances of that template across the entire TemplateMap

**Selection by Lineage**:
Templates are uniquely identified by breadcrumb path:
- Example: `A → B[offset:120000] → C[offset:60000] → D[offset:30000] → E[offset:0]`
- Selecting "E" requires full path, not just name
- Enables editing specific instances in recursive expansion
- Last breadcrumb element becomes focused

**Lineage Path Data Structure**:
```typescript
// Stored in editor.focusPath
type FocusPath = FocusPathItem[];

interface FocusPathItem {
  templateId: string;
  offset?: number; // undefined for base template, number for segments
}

// Example focus path:
[
  { templateId: 'A' }, // Base template (no offset)
  { templateId: 'B', offset: 120000 }, // First segment
  { templateId: 'C', offset: 60000 },  // Nested segment
  { templateId: 'E', offset: 0 }       // Focused element
]
```

**React Key Generation**:
- Keys use lineage path converted to string format
- Format: `"A→B[120000]→C[60000]→E[0]"`
- Ensures stable identity for React reconciliation
- Each visual instance has unique key even if same template appears multiple times
- Prevents incorrect DOM reuse when segment order changes

### Adding Segments Workflow

1. **Focus**: Select target template (base or segment)
2. **Action**: Click "Add Segment" in properties panel
3. **Region Selection**: Pick time region within focused template
4. **Region Highlight**: UI highlights selected region
5. **Template Selection**: Searchable library filtered by:
   - Duration constraints (must fit in selected region)
   - Template type compatibility
6. **Placement**: New segment added with calculated offset
7. **Update**: All instances of focused template update to show new segment

### Nested Variable Summaries

**Purpose**: While building a template, users need visibility into the aggregate nutritional values produced across all nested segments, not just the variables declared in the template itself.

**Calculation Method**:
- Recursively traverse all segments in the focused template
- For each segment, lookup the referenced template
- If template is a BusyTemplate:
  - Add its willProduce variables to totals
  - Add its willConsume variables to totals
- If template is a LaneTemplate:
  - Recursively process its segments
- Continue until all leaf BusyTemplates are accounted for

**Display Format**:
```
Variables (This Template)
  calories: 0 kcal         (no direct variables)
  protein_g: 0 g
  carbs_g: 0 g

Nested Variables Summary
  willProduce:
    calories: 1,350 kcal   (450 × 3 segments)
    protein_g: 120 g       (40 × 3 segments)
    carbs_g: 165 g         (55 × 3 segments)
    fats_g: 36 g           (12 × 3 segments)
    fiber_g: 24 g          (8 × 3 segments)

  willConsume:
    prep_time_ms: 1,800,000 ms (30 minutes total)
    cost_cents: 1,050       ($10.50 total)
    greek_yogurt_g: 600 g   (200 × 3 segments)
    mixed_berries_g: 300 g  (100 × 3 segments)
```

**Use Cases**:
1. **Meal Prep Planning**: See total protein produced across all batches in "Sunday Meal Prep Session"
2. **Daily Schedule**: View aggregate calories consumed across all meals in "Monday Schedule"
3. **Shopping Lists**: Sum all ingredient quantities from willConsume variables
4. **Cost Analysis**: Total cost across all segments in a meal prep session

**Technical Implementation**:
```typescript
function calculateNestedVariables(
  templateId: string,
  templates: TemplateMap
): { willProduce: Record<string, number>; willConsume: Record<string, number> } {
  const template = templates.get(templateId);
  if (!template) return { willProduce: {}, willConsume: {} };

  const totals = { willProduce: {}, willConsume: {} };

  // If BusyTemplate, return its variables directly
  if (template.type === 'busy') {
    return {
      willProduce: { ...template.willProduce },
      willConsume: { ...template.willConsume }
    };
  }

  // If LaneTemplate, recursively sum segment variables
  if (template.type === 'lane') {
    for (const segment of template.segments) {
      const segmentTotals = calculateNestedVariables(segment.busyId, templates);

      // Merge willProduce
      for (const [key, value] of Object.entries(segmentTotals.willProduce)) {
        totals.willProduce[key] = (totals.willProduce[key] || 0) + value;
      }

      // Merge willConsume
      for (const [key, value] of Object.entries(segmentTotals.willConsume)) {
        totals.willConsume[key] = (totals.willConsume[key] || 0) + value;
      }
    }
  }

  return totals;
}
```

### Layout Helper Functions

**Purpose**: Provide one-click access to common layout operations from @tannerbroberts/about-time-core without requiring manual function calls or code editing.

**Available Functions**:

1. **Pack Tightly**
   - **Visual Icon**: Squares touching edge-to-edge
   - **Effect**: All segments start immediately after the previous one (gap = 0)
   - **Code**: `applyLaneLayout(laneId, templates, { justifyContent: 'flex-start', gap: 0 })`
   - **Use Case**: Back-to-back tasks with no breaks (cooking multiple dishes simultaneously)

2. **Distribute Evenly**
   - **Visual Icon**: Squares with equal spacing between them
   - **Effect**: Segments spread evenly across lane duration with equal gaps
   - **Code**: `applyLaneLayout(laneId, templates, { justifyContent: 'space-evenly' })`
   - **Use Case**: Meals spread throughout the day with balanced timing

3. **Add Gap**
   - **Visual Icon**: Two squares with adjustable gap between
   - **UI Flow**:
     1. Click button → opens gap size input (minutes)
     2. User enters gap size (e.g., "30 minutes")
     3. Applies layout with specified gap
   - **Code**: `applyLaneLayout(laneId, templates, { justifyContent: 'flex-start', gap: gapMs })`
   - **Use Case**: Enforce rest periods between meals or prep tasks

4. **Eating Window (Intermittent Fasting)**
   - **Visual Icon**: Timeline with start/end markers
   - **UI Flow**:
     1. Click button → opens start/end time inputs
     2. User enters window (e.g., "12:00 PM - 8:00 PM")
     3. Applies layout with start/end offsets
   - **Code**: `applyLaneLayout(laneId, templates, { justifyContent: 'space-between', startOffset: startMs, endOffset: endMs })`
   - **Use Case**: 16:8 intermittent fasting, all meals within 8-hour window

5. **Fit to Content**
   - **Visual Icon**: Container shrinking to fit contents
   - **Effect**: Sets lane duration to end exactly when last segment completes
   - **Code**: `fitLaneDurationToLast(laneId, templates)`
   - **Use Case**: Auto-size "Morning Routine" to actual time needed

6. **Custom Layout** (Advanced)
   - **Visual Icon**: Gear/settings icon
   - **UI Flow**: Opens advanced panel with all applyLaneLayout options
   - **Options**:
     - `justifyContent`: dropdown (flex-start, center, flex-end, space-between, space-evenly)
     - `gap`: number input (milliseconds)
     - `startOffset`: number input (milliseconds)
     - `endOffset`: number input (milliseconds)
   - **Use Case**: Power users with specific layout requirements

**Visual Feedback**:
- Clicking a layout button shows brief loading indicator
- Hierarchy viewer updates immediately with new segment positions
- Success toast: "Layout applied: Distribute Evenly"
- Undo button appears briefly (future enhancement)

**Keyboard Shortcuts** (future enhancement):
- `Cmd/Ctrl + 1`: Pack Tightly
- `Cmd/Ctrl + 2`: Distribute Evenly
- `Cmd/Ctrl + 3`: Add Gap (opens input)
- `Cmd/Ctrl + 4`: Eating Window (opens input)
- `Cmd/Ctrl + 0`: Fit to Content

**Button Placement**:
- Appears in Properties Panel ONLY when focused element is a LaneTemplate
- Hidden for BusyTemplates (no segments to layout)
- Grouped under "Layout Functions" section
- Prominent placement above "Actions" section

**Integration with about-time-core**:
```typescript
// Example: Distribute Evenly button click handler
const handleDistributeEvenly = (): void => {
  if (!focusedTemplate || focusedTemplate.type !== 'lane') return;

  // Apply layout using about-time-core function
  applyLaneLayout(focusedTemplate.id, templates, {
    justifyContent: 'space-evenly'
  });

  // Zustand store updates automatically
  // All subscribed components re-render with new positions

  // Show success feedback
  showToast('Layout applied: Distribute Evenly', 'success');
};
```

### Implementation: Variable Aggregation & Memoization

**Recursive Calculation**:
- Utility function `calculateNestedVariables(templateId, templates)` in `utils/variableAggregation.ts`
- Traverses segment tree, summing willProduce/willConsume from all leaf BusyTemplates
- Circular dependency protection via visited Set parameter
- O(N) time complexity where N = total segments in tree
- Base case: BusyTemplate returns its own willProduce/willConsume
- Recursive case: LaneTemplate aggregates all segment variables by summing matching keys

**Memoization Strategy**:
- React.useMemo with dependencies `[template.id, templates]`
- Recalculates only when focused template changes or templates map updates
- Zustand's fine-grained subscriptions minimize unnecessary re-renders
- No manual cache needed; React handles memoization lifecycle
- Performance sufficient for deep nesting (10+ levels) and large counts (100+ templates)

**TemplateMap Mutation Pattern**:
- about-time-core functions mutate TemplateMap IN-PLACE for performance
- Layout functions (packSegments, equallyDistributeSegments, etc.) return the mutated template
- Must call `updateTemplate(templateId, result)` after layout operations to trigger Zustand updates
- Zustand notifies all subscribers via fine-grained selectors
- Components with selectors like `useBuildStore(state => state.templates[templateId])` re-render efficiently
- Only components subscribed to the modified template re-render, not siblings or ancestors

**Implementation Files**:
- `/src/Build/utils/variableAggregation.ts` - Recursive aggregation utility with circular dependency protection
- `/src/Build/TemplateEditor/PropertiesPanel/LaneProperties.tsx` - Main component with memoized variable summaries
- `/src/Build/TemplateEditor/PropertiesPanel/LayoutButtons.tsx` - Layout action buttons with about-time-core integration
- `/src/Build/TemplateEditor/PropertiesPanel/index.tsx` - Conditional rendering based on template type

**Implementation Status**: ✅ **Completed and Tested** (2026-02-25)

All LaneProperties features have been implemented and verified via Playwright automated testing:

- ✅ **Nested Variables Summary**: Correctly aggregates willProduce/willConsume from all nested segments recursively
  - Empty state handling: Shows "No production/consumption variables" for empty lanes
  - Live updates: Variables recalculate immediately when segments are added/removed
  - Performance: React.useMemo ensures efficient recalculation only when dependencies change

- ✅ **Layout Operations**: All 4 layout functions integrate correctly with about-time-core
  - **Pack Tightly**: Removes gaps between segments successfully
  - **Distribute Evenly**: Spreads segments evenly across lane duration
  - **Fit to Content**: Resizes lane to match last segment's end time
  - **Add Gap**: Dialog opens, accepts input, applies gap correctly

- ✅ **User Feedback**: Success notifications appear after each layout operation
  - "Layout applied: Pack Tightly"
  - "Layout applied: Distribute Evenly"
  - "Layout applied: Fit to Content"
  - "Layout applied: Add Gap (60000ms)"

- ✅ **Code Quality**: All checks passed
  - ESLint (Airbnb style): Passed
  - TypeScript compilation: Passed
  - Build: Passed (no errors or warnings)

**Test Coverage**:
- Manual Playwright testing covered all user workflows
- Nested variable aggregation tested with 1-3 segments
- All layout buttons tested with visual confirmation
- Dialog interactions tested (Add Gap)
- Notification system verified for all operations

### Change Propagation & Impact Visualization

**Affected Instance Highlighting**:
- When editing a template, highlight all VISIBLE instances
- Includes both:
  - The focused template itself (if visible as segment)
  - All visible segments that reference the template
- Visual indicator format: **"showing X of Y total"**
  - X = visible instances in current edit view (counted recursively)
  - Y = total segments referencing template (from parent references array)

**Example**:
Editing template D shows: "showing 5 of 50 total"
- 5 D instances visible in current recursive expansion
- 50 total segments across all templates reference D
- All 50 will update when changes are saved

**Re-rendering Behavior**:
- There is NO separate "update the rest" operation
- Single source of truth: The template definition in the store
- Changes to template D automatically update ALL visible segments referencing D via Zustand subscriptions
- React reconciliation handles efficient DOM updates using lineage path keys

### Template Library Integration

**Base Template Selection**:
- Searchable library for choosing base template to edit
- Shows all available templates with metadata

**Segment Addition**:
- Filtered library based on:
  - Available space in selected region
  - Duration constraints
  - Type compatibility
- Only shows templates that fit constraints

**Template Types**:
- Uses types from `@tannerbroberts/about-time-core`
- BusyTemplate: Variable-based (willProduce, willConsume)
- LaneTemplate: Layout-based with arrangement rules
- Different properties panel fields per type

### Safety & Data Integrity

**Template Deletion Protection**:
- Delete button NOT shown when editing base template directly
- Only shown for segment deletion (removing reference, not definition)
- Deleting a template is significant - requires separate action

**Circular Dependency Prevention**:
- Validate segment additions don't create cycles
- A template cannot contain itself (directly or indirectly)

**Modification Transparency**:
- Clear visual feedback when changes affect multiple instances
- Undo/redo support for template modifications
- Confirmation for destructive actions

### Visual Design Specification

**Complete design specification clarified with user on 2026-02-09**

**Mobile-First Design**
- Optimized for phone usage
- Bottom navigation bar access to Build tab
- Full-screen modal takeover for create/edit interfaces
- 44pt minimum touch targets for all interactive elements

**Color & Theme**
- Fresh/healthy greens and blues color palette
- Subtle accents (primary colors in key spots, neutral backgrounds)
- User-assigned colors per template for visual identification
- Auto-detect dark mode following system preference

**Typography**
- Rounded sans-serif font (friendly) - Nunito or Quicksand
- Bold labels, normal weight input fields
- System font fallback for performance

**Template Cards**
- Flat with subtle borders
- Variable count indicator:
  - Shows number of variables on BusyTemplate
  - If single variable: display name and numerical value
  - Don't sum variables, just indicate count
- Comfortable spacing optimized for touch

**Filter System**
- Always-visible filter inputs at top
- "Save filter" button at bottom of filter controls
- Filter name picker dropdown at top to select pre-saved filters
- Filters saved permanently across application
- Filter selection saved per context

**Library Display**
- Shown in modal dialogs, not standalone
- Context-aware filtering:
  - When selecting base template: show all templates
  - When adding segment: filter by duration constraints
- Selecting template performs context-specific action

**Interactions**
- Shadow depth change + border highlight on hover/focus
- Quick & snappy animations (fast linear)
- Inline error messages below fields (red text)
- Snackbar notifications for success states

**Hierarchy Viewer (Template Editor)**
- Colored blocks with nesting levels showing time and depth
- Horizontal axis: Time offset within template (left to right)
- Vertical axis: Nesting depth (bottom to top)
- Continuous ruler with time labels (0min, 5min, 10min, etc.)
- Base template: Full width at bottom
- Nested segments: Stacked higher, positioned by their offset

**Vertical Space Management**
- Level depth clamp set by user
- "+X" additional levels indicators above segments
- Appears on segments that are lanes with additional clamped segments
- Prevents overwhelming vertical space with deep nesting

**Empty Space & Segment Addition**
- Dashed outline region showing where segments can be placed
- Tap/click dashed region to initiate segment addition
- Opens filtered library modal based on available duration
- Clear visual distinction from filled segments

**Breadcrumb Lineage Path**
- Horizontal with arrows: A → B[offset:120000] → C[offset:60000] → D
- Shows full path for lineage-based selection
- Last element in path is the focused template
- Determines what appears in properties panel

**Change Impact Visualization**
- Pulse/flash animation on affected instances when editing
- Badge showing "showing X of Y total" instances
- Outline/border highlights all affected segments in view
- X = visible instances in current recursive expansion
- Y = total segments across all templates that reference this template

**Empty States**
- Illustration/icon showing template creation concept
- Call-to-action button to create first template
- Friendly, approachable messaging
- Material Design icons throughout

### Technical Rendering Specification

**Recursive Component Architecture**:
- Single `<Segment>` component renders recursively with React.memo optimization
- Each instance subscribes to `state.templates.get(templateId)` via Zustand selector
- Component renders child segments recursively until depth clamp reached
- React keys use lineage path strings: `"A→B[120000]→C[60000]→E[0]"`

**Zoom & Positioning System**:
- **Default zoom**: Base template fills 97% of viewport width (no horizontal scrollbar)
- **User controls**: Pinch/slider to zoom (max 3X zoom in, no zoom out allowed)
- **Offset-to-pixels conversion**: `(offset_ms / baseDuration_ms) * (viewportWidth * 0.97 * zoomLevel)`
- **Horizontal scroll**: Container scrolls when zoomed beyond viewport width
- **Vertical positioning**: Segments stack by depth level (bottom to top)

**Depth Clamping**:
- Global `maxDepth` setting in editor state
- User adjusts via UI control (e.g., slider)
- Segments beyond clamp show "+X additional levels" indicator
- Prevents overwhelming vertical space with deep nesting

**Empty Region Rendering**:
- Dashed outline regions shown ONLY when `isAddingSegment === true`
- Activated by "Add Segment" button in properties panel
- Calculate time gaps between existing segments in focused template
- Click dashed region → opens filtered template library modal

**Empty State Handling**:
1. **No templates in library** (`templates.size === 0`):
   - Full-screen empty state in Build tab
   - Center-aligned illustration + message: "Build your first meal template"
   - Prominent "Create Template" button
   - First-time user onboarding experience

2. **No base template selected** (`templates.size > 0` but `focusPath === null`):
   - Empty state in hierarchy viewer region only
   - Illustration + message: "Select a template to edit"
   - Button to open template library modal
   - Properties panel hidden or shows placeholder

**State Flow**: Empty library → Create first template → No selection state → Select template → Editor active

## State Management

**IMPORTANT**: Build uses Zustand instead of the standard useReducer+Context pattern. This is an exception to the codebase pattern due to the need for fine-grained reactivity in the recursive template visualization.

### Zustand Store Structure

```typescript
interface BuildState {
  // Template data (single source of truth)
  templates: TemplateMap; // All templates loaded in memory with stable reference IDs

  // Library view state
  searchQuery: string;
  sortBy: 'recent' | 'name' | 'calories' | 'protein';
  savedFilters: Record<string, FilterConfig>;
  activeFilterName: string | null;

  // Editor state
  editor: {
    focusPath: FocusPathItem[] | null; // Lineage-based selection (null = no base selected)
    maxDepth: number; // Global depth clamp for vertical space management
    zoomLevel: number; // User-controlled zoom (default: 1.0 = 97% width, max: 3.0, min: 1.0)
    isAddingSegment: boolean; // Shows empty region dashed outlines
  };

  // UI state
  isCreating: boolean;
  isLibraryModalOpen: boolean;
}

// Lineage path for breadcrumb-based selection
interface FocusPathItem {
  templateId: string;
  offset?: number; // undefined for base template, number for segments
}

// Actions (Zustand setter functions)
interface BuildActions {
  // Template CRUD (uses @tannerbroberts/about-time-core functions)
  createTemplate: (template: BusyTemplate | LaneTemplate) => void;
  updateTemplate: (id: string, updates: Partial<BusyTemplate | LaneTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Editor actions
  setFocusPath: (path: FocusPathItem[] | null) => void;
  setMaxDepth: (depth: number) => void;
  setZoomLevel: (zoom: number) => void;
  toggleAddSegmentMode: () => void;

  // Library actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: BuildState['sortBy']) => void;
  openLibraryModal: () => void;
  closeLibraryModal: () => void;
}
```

### Component Subscription Pattern

**Segment components use fine-grained selectors** to minimize re-renders:

```typescript
// Each segment subscribes only to its specific template
const Segment: React.FC<SegmentProps> = React.memo(({ templateId, depth, offset }) => {
  const template = useBuildStore(state => state.templates.get(templateId));
  // Only re-renders when THIS template changes
});
```

### Re-rendering Behavior

- **Single source of truth**: Template changes in the store automatically propagate to all visible segments
- **All visible references update**: When template D is modified, all visible segments referencing D re-render via Zustand subscriptions
- **No "batch update" operation**: The store mutation IS the update; React handles re-rendering subscribed components
- **React.memo optimization**: Unchanged segments in the tree don't re-render even if siblings do

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

## MVP Feature Priority

### Phase 1 (MVP Core)
- Manual form-based template creation
- Dense template library with basic search
- LocalStorage persistence
- Basic CRUD operations (Create, Read, Update, Delete)
- Template composition (nesting templates)

### Phase 2 (Enhanced Features)
- Template variants and duplication
- Advanced search and filtering
- Template categories and tags
- Batch operations (duplicate, delete multiple)
- Template usage analytics

### Phase 3 (Advanced Features)
- Recipe import from URLs
- AI-assisted nutrition estimation
- Community template sharing
- Template recommendations based on goals
- Nutritional analysis and insights

## Success Metrics

1. **Template Creation Rate**: Number of templates created per user
2. **Template Completion Rate**: Percentage of templates with full nutrition data vs. minimal data
3. **Template Reuse**: Average number of times each template is scheduled
4. **Library Size**: Total templates in user's library over time
5. **Search Usage**: Percentage of users using search vs. scrolling

## Technical Considerations

### Validation
- Ensure all required fields are present (intent, duration)
- Validate positive values for nutrition data
- Check for duplicate template names (warn user)
- Validate nested template references (no circular dependencies)

### Performance
- Lazy-load template details (show summaries first)
- Virtualize list rendering for large libraries
- Debounce search input
- Optimize form validation to avoid excessive re-renders

### Persistence
- LocalStorage for MVP (TemplateMap serialization)
- Auto-save on every change
- Export/Import functionality for backup
- Future: Backend API for sync across devices

### Accessibility
- Keyboard navigation for template list
- Screen reader support for nutrition values
- Focus management for modals
- Clear error messages and validation feedback
