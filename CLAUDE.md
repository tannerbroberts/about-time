# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Build (runs lint check + TypeScript compilation + Vite build)
npm run build

# Lint check
npm run lint

# Auto-fix lint issues
npm run lint:fix
# or
npm run format
```

## Testing with Playwright

**IMPORTANT:** When implementing or modifying features, ALWAYS test them using Playwright browser automation. This ensures the UI works correctly and catches integration issues early.

### Why Playwright?
- Tests the actual user experience in a real browser
- Catches UI/UX issues that unit tests miss
- Verifies frontend-backend integration
- Provides visual snapshots for debugging
- Works even when the developer isn't at their computer

### How to Use Playwright

After implementing a feature:

1. **Ensure servers are running:**
   ```bash
   # Backend: http://localhost:3001
   npm run dev --workspace=@about-time/backend

   # Frontend: http://localhost:5173 (or auto-assigned port)
   npm run dev --workspace=@about-time/frontend
   ```

2. **Use Playwright tools to interact with the UI:**
   - `browser_navigate` - Go to a page
   - `browser_snapshot` - View the current page structure
   - `browser_click` - Click buttons/elements
   - `browser_type` - Fill in forms
   - `browser_wait_for` - Wait for elements or time
   - `browser_take_screenshot` - Capture visual state
   - `browser_console_messages` - Check for errors

3. **Test critical user flows:**
   - Create/edit/delete operations
   - Form submissions
   - Modal dialogs
   - Notifications
   - Navigation between pages
   - Error states

### Example Test Flow

```typescript
// Navigate to the app
browser_navigate("http://localhost:5173/")

// Take a snapshot to see the page
browser_snapshot()

// Click a button
browser_click({ ref: "button-id", element: "Create Template button" })

// Fill a form
browser_type({ ref: "input-id", text: "Test Template", element: "Intent field" })

// Verify success
browser_snapshot() // Check for success message
```

### Testing Tips

- **Always check console messages** for errors using `browser_console_messages()`
- **Test both success and error paths** (e.g., invalid form inputs)
- **Verify visual feedback** (notifications, loading states, disabled buttons)
- **Test API endpoints directly** if Playwright encounters issues with the UI
- **Document any workarounds** for known testing limitations

### Known Testing Limitations

- **Auth retry loops**: The app may get stuck in infinite auth retries. Test API endpoints directly with curl as a fallback.
- **Build package exports**: Ensure packages are built (`npm run build --workspace=package-name`) before testing imports.

## Architecture Overview

This is a React + TypeScript application using Vite. The codebase enforces strict Airbnb-style coding standards via ESLint that **will cause builds to fail** if violated.

### Key ESLint Enforcements
- **Explicit function return types required** (`@typescript-eslint/explicit-function-return-type`)
- **2-space indentation** for all code
- **Single quotes** for strings, **double quotes** for JSX attributes
- **Sorted imports** with newlines between groups (builtin, external, internal, parent, sibling, index)
- **No unused variables** (prefix with `_` to mark as intentionally unused)
- **Max line length**: 150 characters

### State Management Pattern

**Standard Pattern**: Most components with state follow this folder structure pattern:

```
ComponentName/
  ├── index.tsx              # Component (uses useReducer)
  ├── Context.ts             # React.createContext<ComponentNameContextValue>
  ├── Provider.tsx           # (Optional) Export of Context.Provider
  ├── reducer.ts             # Reducer function, action types, default state
  └── useContext.ts          # Hook to access context with undefined check
```

**File responsibilities:**
- `reducer.ts`: Exports `DefaultComponentNameState`, action types, `ComponentNameContextValue` interface, and the `reducer` function
- `Context.ts`: Creates the React context using the `ComponentNameContextValue` type from reducer
- `Provider.tsx`: (Optional) Exports the Provider as a named export (e.g., `export const ComponentNameProvider = Context.Provider`). Some features like `App/` use `Context.Provider` directly in `index.tsx` instead.
- `useContext.ts`: Provides type-safe access to context with error handling if used outside provider. Named with component prefix (e.g., `useAppContext` for App component)
- `index.tsx`: The component itself, which calls `useReducer(reducer, DefaultState)` and wraps children in the Provider (either from Provider.tsx or Context.Provider directly)

**Exception - Build Feature**: The Build feature uses **Zustand** instead of the standard useReducer+Context pattern due to the need for fine-grained reactivity in the recursive template visualization. This allows individual segment components to subscribe only to their specific template data, preventing unnecessary re-renders in the complex nested hierarchy.

**Rationale for Zustand in Build:**
- Recursive visualization can render 100+ nested segment components
- With Context+useReducer, any template change re-renders the entire tree
- Zustand enables fine-grained selectors: `useBuildStore(state => state.templates[templateId])`
- Only the specific segment that changed re-renders, not siblings or ancestors
- Performance gain is critical for interactive 2D hierarchy editing

**Usage pattern:**
```typescript
// ❌ Bad: Subscribes to entire state, re-renders on any change
const state = useBuildStore();

// ✅ Good: Subscribes only to specific template
const template = useBuildStore(state => state.templates[templateId]);

// ✅ Good: Subscribes to specific action
const updateTemplate = useBuildStore(state => state.updateTemplate);
```

See PRD-Build.md for complete Zustand store specification.

### ActionTreeMenu Component

The Build feature includes a context-aware action menu system (`ActionTreeMenu`) that appears when users click on segments or empty regions in the hierarchy viewer.

**Architecture:**
- **Layout**: Horizontal bars of icon buttons stacked vertically
- **Hierarchy**: 3 levels (root categories → category actions → nested actions)
- **Submenus**: Appear ABOVE the root categories (not below)
- **Close button**: Centered at the bottom of the menu
- **State**: Managed via Zustand (consistent with Build feature)
- **Animations**: Framer Motion's Collapse component for smooth expand/collapse

**Menu Structure:**
```
┌─────────────────────────────────────┐
│  [Create Busy] [Create Lane]       │  ← Level 3: Nested submenu (when open)
├─────────────────────────────────────┤
│  [Select Existing] [Create New]    │  ← Level 2: Category actions (when open)
├─────────────────────────────────────┤
│  [Add] [Edit] [Layout] [Navigate]  │  ← Level 1: Root categories (always visible)
├─────────────────────────────────────┤
│            [Close ✕]                │  ← Close button (centered)
└─────────────────────────────────────┘
```

**Context-Aware Actions:**
- Actions are enabled/disabled based on the focused template type
- `useContextActions` hook determines availability and provides disabled reasons
- Example: Layout operations only available for LaneTemplates
- Tooltips show why actions are disabled when hovered

**Key Behaviors:**
- **Mutually exclusive expansion**: Opening one category closes others
- **Progressive ESC closing**: Submenu → Category → Entire menu
- **Open/closed icons**: ChevronRight when closed, ExpandMore when open
- **Backdrop**: Semi-transparent overlay closes menu on click
- **Positioning**: Floats at click coordinates with z-index 1300-1400

**Integration Points:**
- Click handlers in `Segment.tsx` and `HierarchyViewer/index.tsx` (for empty space) trigger menu
- Menu actions call Zustand store methods (duplicate, remove, pack, etc.)
- Layout functions integrate with `@tannerbroberts/about-time-core`
- Notifications provide success feedback for all operations

**File Structure:**
```
ActionTreeMenu/
  ├── index.tsx                 # Main container with bar layout
  ├── MenuNode.tsx              # Category icon button component
  ├── ActionLeaf.tsx            # Action icon button component
  ├── useContextActions.ts      # Context-aware availability hook
  ├── actions/
  │   ├── AddActions.tsx        # Add category (create/select segments)
  │   ├── EditActions.tsx       # Edit category (duplicate/remove)
  │   ├── LayoutActions.tsx     # Layout category (pack/distribute/fit/gap)
  │   └── NavigateActions.tsx   # Navigate category (focus parent/change base)
  └── types.ts                  # Type definitions
```

### Library System

The Library System provides template organization through scoped collections with many-to-many relationships.

**Core Concepts:**
- **Libraries**: Named collections that organize templates by context or purpose
- **Many-to-Many**: Templates can belong to multiple libraries simultaneously
- **Scoped Libraries**: Each LaneTemplate auto-creates its own library for child templates
- **Global Library**: All templates remain accessible in the main template list

**Data Model:**
- `libraries` table: Library metadata (name, description, visibility, owner, lane template link)
- `library_memberships` table: Many-to-many junction (library ↔ template with notes, tags, order)
- Templates maintain independent existence; deleting a library only removes memberships

**API Endpoints:**
```
GET    /api/libraries              # List user's libraries
GET    /api/libraries/:id          # Get library details
POST   /api/libraries              # Create library
PUT    /api/libraries/:id          # Update library metadata
DELETE /api/libraries/:id          # Delete library (keeps templates)

GET    /api/libraries/:id/templates              # List templates in library
POST   /api/libraries/:id/templates              # Add template to library
PUT    /api/libraries/:id/templates/:templateId  # Update membership metadata
DELETE /api/libraries/:id/templates/:templateId  # Remove from library (keeps template)
```

**Key UX Patterns:**

1. **Remove vs Delete Distinction:**
   - **Remove from Library**: Breaks membership link, template remains
   - **Delete Template**: Permanently deletes template from all libraries
   - Confirmation dialogs clearly explain the difference

2. **Library Browser (LibraryBrowser/):**
   - Modal dialog for managing libraries
   - Create/edit/delete libraries
   - View templates in each library
   - Add/remove templates with search

3. **Template Library Badges (TemplateLibraryBadges.tsx):**
   - Shows which libraries contain each template
   - Displayed on template cards
   - Tooltip shows full list if in 3+ libraries
   - Uses useMemo to efficiently compute membership

4. **Library Filtering:**
   - BaseTemplateSelectionModal includes library dropdown
   - Filter templates by library when building
   - "All Templates" option for unfiltered view

5. **Quick Add to Library:**
   - Folder icon button on template cards
   - LibrarySelector dialog with search
   - One-click addition to any library

**State Management:**
- Managed in Build store (Zustand)
- `libraries`: Record<string, Library> - All user libraries
- `libraryTemplates`: Record<string, Template[]> - Templates per library
- `selectedLibraryId`: Currently viewing library
- Actions: loadLibraries, createLibrary, addTemplateToLibrary, etc.

**Auto-Creation:**
- LaneTemplates automatically get a library: `{intent} Library`
- Created in TemplateService.createTemplate() when templateType === 'lane'
- Failure to create library doesn't block template creation (logged error)

**File Structure:**
```
Build/
  ├── LibraryBrowser/
  │   ├── index.tsx             # Main library management dialog
  │   ├── LibraryCard.tsx       # Display library info
  │   ├── LibraryForm.tsx       # Create/edit library form
  │   ├── LibraryDetail.tsx     # View templates in library
  │   └── TemplateSelector.tsx  # Add templates to library
  ├── Library/
  │   ├── LibrarySelector.tsx       # Select library for template
  │   └── TemplateLibraryBadges.tsx # Show library membership
  └── store.ts                      # Library state & actions

packages/
  └── api-client/src/
      └── libraries.ts          # Library API client methods
```

**Integration Points:**
- Library button in main template view opens LibraryBrowser
- Folder icon on template cards opens LibrarySelector
- Template picker includes library filter dropdown
- All operations show success/error notifications

**Advanced Features:**
- **Usage Tracking**: Templates track `lastUsedAt` and `usageCount` when added to segments
- **Cleanup Tools**: Find unused templates (>90 days or never used) with bulk remove
- **Export/Import**: Export library as JSON, import creates new library with all templates
- **Circular Reference Prevention**: Prevents adding Lane A to Lane B's library if Lane B is in Lane A
- **De-duplication Toggle**: View templates once even if in multiple libraries

### Composite Variables

Composite variables are reusable groups of variables that can be versioned, forked, and live-linked.

**Core Concepts:**
- **Composite**: Named group of variables with confidence bounds (e.g., "complete_meal")
- **Snapshot**: Frozen copy at specific version, won't change
- **Live Link**: Reference to latest version, automatically updates
- **Expansion**: Multiplying composite by count expands to atomic values

**Data Model:**
```typescript
interface CompositeUnitDefinition {
  id: string;
  name: string;
  version: number;
  composition: Record<string, ValueWithConfidence>;
  authorId: string;
  originCompositeId: string | null;
  linkType: 'original' | 'forked' | 'live-linked';
  changelog?: string;
}

type VariableValue =
  | { type: 'atomic'; data: ValueWithConfidence }
  | { type: 'composite-live'; data: CompositeLiveReference }
  | { type: 'composite-snapshot'; data: CompositeSnapshot };
```

**Database Schema:**
- `composite_unit_definitions` table: Composite metadata and composition
- Stored in `packages/types/src/composite.ts`
- Expansion algorithm in `packages/core/src/variables/expandComposite.ts`

**API Endpoints:**
```
GET    /api/composites              # List user's composites
GET    /api/composites/:id          # Get composite
GET    /api/composites/:id/versions # Get all versions
POST   /api/composites              # Create composite
PUT    /api/composites/:id          # Update (creates new version)
DELETE /api/composites/:id          # Delete composite
POST   /api/composites/:id/fork     # Create independent copy
POST   /api/composites/:id/live-link # Create live reference
POST   /api/composites/:id/bulk-update-snapshots # Update all snapshots
```

**UI Components:**
- **CreateCompositeDialog**: Full-screen dialog for creating composites
- **CompositeVariablePicker**: Two-step picker (selection → configuration)
- **EnhancedVariablesList**: Shows both composite and expanded views

**Expansion Algorithm:**
```typescript
// 3 × complete_meal
// Input:  { calories: 500, protein_g: 50 }
// Output: { calories: 1500, protein_g: 150 }

function expandComposite(
  composition: Record<string, ValueWithConfidence>,
  count: number
): Record<string, ValueWithConfidence> {
  const expanded: Record<string, ValueWithConfidence> = {};
  for (const [variableName, value] of Object.entries(composition)) {
    const normalized = normalizeValue(value);
    expanded[variableName] = multiplyByScalar(normalized, count);
  }
  return expanded;
}
```

**Versioning:**
- Each update increments version number
- Snapshots capture specific version
- Live links always use latest version
- Changelog tracks changes between versions

### Confidence Factors

Confidence factors express uncertainty in measurements using intervals.

**Core Concepts:**
- **Nominal Value**: Expected/average value
- **Confidence Bounds**: Lower and upper limits
- **Propagation**: Combining multiple confidence intervals
- **Display Format**: `500 ±10% (450-550)`

**Data Model:**
```typescript
interface ValueWithConfidence {
  value: number;     // Nominal/expected value
  lower?: number;    // Lower confidence bound
  upper?: number;    // Upper confidence bound
}
```

**Database Schema:**
- `template_variables` table stores confidence bounds
- Columns: `nominal_value`, `lower_bound`, `upper_bound`
- Per-variable confidence tracking

**Propagation Algorithm:**
```typescript
function aggregateWithConfidence(
  values: ValueWithConfidence[]
): ValueWithConfidence {
  const totalValue = values.reduce((sum, v) => sum + v.value, 0);
  const totalLower = values.reduce((sum, v) => sum + (v.lower ?? v.value), 0);
  const totalUpper = values.reduce((sum, v) => sum + (v.upper ?? v.value), 0);

  // Apply ceiling to prevent unbounded growth (max ±25%)
  const range = totalUpper - totalLower;
  const maxRange = totalValue * 0.5;

  if (range > maxRange) {
    const adjustment = (range - maxRange) / 2;
    return {
      value: totalValue,
      lower: totalLower + adjustment,
      upper: totalUpper - adjustment,
    };
  }

  return { value: totalValue, lower: totalLower, upper: totalUpper };
}
```

**UI Components:**
- **ConfidenceInput**: Input component with nominal, lower, upper fields
- **VariableViewToggle**: Toggle between composite/expanded views
- **EnhancedVariablesList**: Shows confidence bounds in both views

**View Modes:**
- **Composite View**: Shows high-level units (e.g., "2 × complete_meal")
- **Expanded View**: Shows all atomic values with sources and confidence
- Toggle persisted in localStorage
- Smooth transition animations

**Best Practices:**
- Typical ranges: ±5-20%
- Tighter for measurements (±5%)
- Wider for estimates (±20-30%)
- Always include some uncertainty
- Review propagated confidence in aggregated views
