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

All components with state follow this folder structure pattern (see `App/` as reference):

```
ComponentName/
  ├── index.tsx              # Component (uses useReducer)
  ├── Context.ts             # React.createContext<ComponentNameContextValue>
  ├── Provider.tsx           # Export of Context.Provider
  ├── reducer.ts             # Reducer function, action types, default state
  └── useContext.ts          # Hook to access context with undefined check
```

**File responsibilities:**
- `reducer.ts`: Exports `DefaultComponentNameState`, action types, `ComponentNameContextValue` interface, and the `reducer` function
- `Context.ts`: Creates the React context using the `ComponentNameContextValue` type from reducer
- `Provider.tsx`: Exports the Provider as a named export (e.g., `export const ComponentNameProvider = Context.Provider`)
- `useContext.ts`: Provides type-safe access to context with error handling if used outside provider. Named with component prefix (e.g., `useAppContext` for App component)
- `index.tsx`: The component itself, which calls `useReducer(reducer, DefaultState)` and wraps children in the Provider
