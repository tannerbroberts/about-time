# PRD: Build - Template Creation & Management

## Overview

The Build feature enables users to create and manage reusable meal templates with complete nutritional profiles using the about-time-core template system.

## Goal

Create reusable meal templates with complete nutritional profiles that can be scheduled and tracked.

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
- **Actions**:
  - Add segment (see workflow below)
  - Delete segment (only visible for segments, NOT base templates)
  - Duplicate template (creates new record with different name)

### Focused Element System

**"Focused" Concept**:
- Either the base template OR a segment within it
- Determines what shows in properties panel
- Affects which segments can be added/removed

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
