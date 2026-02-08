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
```

## Architecture Overview

This is a React + TypeScript application using Vite. The codebase enforces strict architectural patterns via custom ESLint rules that **will cause builds to fail** if violated.

### State Management Pattern

All components follow the App folder pattern, which demonstrates the canonical state management architecture:

```
ComponentName/
  ├── index.tsx              # Component (uses useReducer, other custom hooks specific to this component contain all logic)
  ├── Context.ts             # React.createContext<ComponentNameContextValue>
  ├── Provider.tsx           # Export of Context.Provider
  ├── reducer.ts             # Reducer function, action types, default state
  └── useContext.ts          # Hook to access context with undefined check
```

**Key files and their roles:**
- `reducer.ts`: Exports `DefaultComponentNameState`, action types, `ComponentNameContextValue` interface, and the `reducer` function
- `Context.ts`: Creates the React context using the `ComponentNameContextValue` type from reducer
- `Provider.tsx`: Exports the Provider as a named export (e.g., `export const ComponentNameProvider = Context.Provider`)
- `useContext.ts`: Provides type-safe access to context with error handling if used outside provider. Named simply `useContext` since the folder path provides namespacing (e.g., `import { useContext } from '../../App'`)
- `index.tsx`: The component itself, which calls `useReducer(reducer, DefaultState)` and wraps children in the Provider
