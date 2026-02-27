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
