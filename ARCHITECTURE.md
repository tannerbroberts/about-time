# Architecture Rules Documentation

This project enforces strict architectural patterns through custom ESLint rules. These rules are designed to break builds with compile-time errors, ensuring consistency and maintainability.

## Quick Reference

| Rule | Description |
|------|-------------|
| `no-hooks-in-components` | No `useState`, `useEffect`, etc. directly in `.tsx` files |
| `named-exports-only` | All exports must be named (no `export default`) |
| `hooks-only-in-hook-files` | Core hooks only allowed in `use*.ts` files |
| `memo-component-rules` | `React.memo` components must be prefixed with "Memo" |
| `context-provider-file` | Providers must be in separate `*Provider.tsx` files |
| `component-folder-structure` | Every component needs its own folder with `index.ts` |
| `import-boundaries` | Strict parent/child import rules for components and context |
| `file-export-name-match` | File names must match export names |
| `memo-no-context-hooks` | Memo components cannot use context hooks |
| `import-from-index` | Imports must come from folder paths (via index), not direct file paths |

---

## Rule Details

### 1. No Hooks in Components (`no-hooks-in-components`)

**TSX component files can ONLY contain:**
- Component imports
- Context hook calls (custom hooks like `useAppContext`)
- State handler hook calls (custom hooks like `useAppState`)

**Forbidden in component files:**
- `useState`
- `useEffect`
- `useCallback`
- `useMemo`
- `useRef`
- `useContext`

```tsx
// ❌ BAD: App.tsx
export function App() {
  const [count, setCount] = useState(0);  // ERROR!
  useEffect(() => { }, []);               // ERROR!
  return <div>{count}</div>;
}

// ✅ GOOD: App.tsx
export function App() {
  const { count, increment } = useAppState();  // Custom hook - OK
  return <div onClick={increment}>{count}</div>;
}

// ✅ GOOD: useAppState.ts
export function useAppState() {
  const [count, setCount] = useState(0);  // OK in hook file
  const increment = useCallback(() => setCount(c => c + 1), []);
  return { count, increment };
}
```

---

### 2. Named Exports Only (`named-exports-only`)

All exports MUST be named. Default exports are forbidden.

```tsx
// ❌ BAD
export default function App() { }

// ✅ GOOD
export function App() { }
export const App = () => { };
```

---

### 3. Hooks Only in Hook Files (`hooks-only-in-hook-files`)

These hooks can ONLY be used in files prefixed with `use` (e.g., `useAppState.ts`):
- `useState`
- `useCallback`
- `useEffect`
- `useMemo`

```
// ✅ Valid hook file names:
useAppState.ts
useFormHandler.ts
useAuthContext.ts

// ❌ Invalid (cannot use hooks):
App.tsx
helpers.ts
utils.ts
```

---

### 4. Memo Component Rules (`memo-component-rules`)

- Components wrapped in `React.memo` MUST be prefixed with "Memo"
- Memo components can ONLY receive props
- Memo components CANNOT call context hooks

```tsx
// ❌ BAD
export const Button = memo(({ label }) => <button>{label}</button>);

// ✅ GOOD
export const MemoButton = memo(({ label }) => <button>{label}</button>);

// ❌ BAD: Memo component using context
export const MemoNav = memo(() => {
  const { user } = useAuthContext();  // ERROR!
  return <nav>{user.name}</nav>;
});

// ✅ GOOD: Memo component only using props
export const MemoNav = memo(({ userName }) => {
  return <nav>{userName}</nav>;
});
```

---

### 5. Context Provider File (`context-provider-file`)

Context providers must be declared in separate files named after the component:

```
src/
├── App/
│   ├── App.tsx           # Main component
│   ├── AppProvider.tsx   # Context provider
│   ├── AppContext.ts     # Context definition
│   └── index.ts          # Exports
```

```tsx
// ❌ BAD: Provider inline in App.tsx
export function App() {
  const state = useAppState();
  return (
    <AppContext.Provider value={state}>  // ERROR!
      <Content />
    </AppContext.Provider>
  );
}

// ✅ GOOD: AppProvider.tsx
export function AppProvider({ children }) {
  const state = useAppState();
  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  );
}

// ✅ GOOD: App.tsx
export function App() {
  return (
    <AppProvider>
      <Content />
    </AppProvider>
  );
}
```

---

### 6. Component Folder Structure (`component-folder-structure`)

Every component needs its own folder with an index file.

```
src/
├── App/
│   ├── index.ts          # ONLY exports App and AppContext
│   ├── App.tsx
│   ├── AppContext.ts
│   └── useAppState.ts    # NOT exported from index
├── Header/
│   ├── index.ts
│   ├── Header.tsx
│   └── useHeaderState.ts
```

```tsx
// ✅ GOOD: index.ts
export { App } from './App';
export { AppContext, useAppContext } from './AppContext';

// ❌ BAD: index.ts
export { App } from './App';
export { useAppState } from './useAppState';    // ERROR! No hooks
export { formatDate } from './helpers';          // ERROR! No helpers
```

---

### 7. Import Boundaries (`import-boundaries`)

**Context hooks:** Can ONLY be imported from DIRECT parent directories

```tsx
// File: src/App/Header/Nav/Nav.tsx

// ✅ GOOD: Direct parent
import { useHeaderContext } from '../HeaderContext';

// ❌ BAD: Grandparent (too far up)
import { useAppContext } from '../../AppContext';

// ❌ BAD: Sibling
import { useFooterContext } from '../Footer/FooterContext';
```

**Components:** Can ONLY be imported from DIRECT descendant directories

```tsx
// File: src/App/App.tsx

// ✅ GOOD: Direct child
import { Header } from './Header';

// ❌ BAD: Grandchild
import { NavItem } from './Header/Nav/NavItem';

// ❌ BAD: Parent
import { Root } from '../Root';
```

**Exception:** Shared components from `Shared*` directories

```tsx
// ✅ GOOD: Shared components can be imported from anywhere
import { SharedButton } from '../../SharedComponents';
import { SharedModal } from '../../../SharedUI';
```

---

### 8. File Export Name Match (`file-export-name-match`)

File names MUST match their primary export name.
Folder names MUST match the component name (except Shared folders).

```
// ✅ GOOD
Header.tsx → export function Header() { }
useAppState.ts → export function useAppState() { }
AppContext.ts → export const AppContext = createContext(...);

// ❌ BAD
header.tsx → export function Header() { }      // Case mismatch
HeaderComponent.tsx → export function Header() { }  // Name mismatch
```

---

### 9. Import From Index (`import-from-index`)

All imports MUST come from folder paths (via index file exports), NEVER from direct file paths inside a folder.

```tsx
// ✅ GOOD: Import from folder (uses index.ts)
import { Header } from './Header';
import { useAppContext } from '../App';
import { SharedButton } from '../../SharedComponents';

// ❌ BAD: Import directly from file inside folder
import { Header } from './Header/Header';           // ERROR!
import { useAppContext } from '../App/AppContext';  // ERROR!
import { Nav } from './Header/Nav/Nav';             // ERROR!
```

**Why this matters:**
- Enforces proper encapsulation through index files
- Folder internals remain private implementation details
- Makes refactoring easier (internal file changes don't break imports)
- Index files serve as the public API for each folder

```
src/
├── App/
│   ├── index.ts          # Public API: exports App, AppContext
│   ├── App.tsx           # Implementation (import via index)
│   ├── AppContext.ts     # Implementation (import via index)
│   └── useAppState.ts    # Private (NOT exported from index)
```

---

## Folder Structure Example

```
src/
├── main.tsx                    # Entry point
├── App/
│   ├── index.ts               # export { App } from './App';
│   ├── App.tsx                # Main App component
│   ├── AppContext.ts          # Context definition + useAppContext
│   ├── AppProvider.tsx        # Provider wrapper
│   ├── useAppState.ts         # State hook (useState, useEffect, etc.)
│   │
│   ├── Header/
│   │   ├── index.ts
│   │   ├── Header.tsx
│   │   ├── HeaderContext.ts
│   │   ├── useHeaderState.ts
│   │   │
│   │   └── Nav/
│   │       ├── index.ts
│   │       ├── Nav.tsx
│   │       └── MemoNavItem.tsx   # Pure component with React.memo
│   │
│   └── Footer/
│       ├── index.ts
│       ├── Footer.tsx
│       └── MemoFooterLink.tsx
│
└── SharedComponents/
    ├── index.ts
    ├── SharedButton.tsx
    ├── SharedModal.tsx
    └── SharedInput.tsx
```

---

## Migration Guide

When converting existing components:

1. **Extract hooks** to `use*.ts` files
2. **Rename default exports** to named exports
3. **Create folders** for each component with `index.ts`
4. **Move providers** to `*Provider.tsx` files
5. **Check imports** for boundary violations
6. **Prefix memo components** with "Memo"
7. **Rename Shared components** with "Shared" prefix

---

## Disabling Rules (Evidence of internal reasoning error)
It has been found that this architecture is turring complete, and that any program can be expressed through
this file system's layout rules. If disabling a lint rule on a line seems like a good idea, it's because you
are capable of having bad ideas that you like, and you STILL shouldn't disable the rule.