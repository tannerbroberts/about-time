# Copilot Instructions for about-time

This project enforces strict architectural patterns via custom ESLint rules. **Builds will fail** if these rules are violated. Never disable lint rules.

## Critical Rules

### Component Folder Structure

Every component **must** have its own folder with an `index.ts` file:

```
ComponentName/
  ├── ComponentName.tsx
  └── index.ts
```

**Never** create a component file directly inside another component's folder. This is wrong:
```
❌ Library/ItemListItem.tsx
```

This is correct:
```
✅ Library/ItemListItem/ItemListItem.tsx
✅ Library/ItemListItem/index.ts
```

### File/Folder Name Matching

- File names must match their primary export: `Header.tsx` → `export function Header()`
- Folder names must match the component name inside

### No Hooks in Component Files (.tsx)

These hooks are **forbidden** directly in `.tsx` files:
- `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useContext`

Extract all hook logic to a `use*.ts` file in the same folder:

```
MyComponent/
  ├── MyComponent.tsx      # Only JSX, calls useMyComponentState()
  ├── useMyComponentState.ts  # Contains useState, useEffect, etc.
  └── index.ts
```

### Explicit Return Types

All functions **must** have explicit return type annotations. These rules are enforced:
```
'@typescript-eslint/explicit-function-return-type': 'error'
'@typescript-eslint/explicit-module-boundary-types': 'error'
```

Examples:
```tsx
// ❌ function add(a: number, b: number) { return a + b; }
// ✅ function add(a: number, b: number): number { return a + b; }

// ❌ const onClick = () => { ... }
// ✅ const onClick = (): void => { ... }

// ❌ export function App() { return <div />; }
// ✅ export function App(): React.ReactElement { return <div />; }
```

### Named Exports Only

No default exports. Always use named exports:
```tsx
// ❌ export default function App()
// ✅ export function App()
```

### Import From Index Only

Import from folder paths, never from files inside folders:
```tsx
// ❌ import { Header } from './Header/Header';
// ✅ import { Header } from './Header';
```

### Import Boundaries

- **Context hooks**: Only from direct ancestor directories (parent, grandparent, great-grandparent, etc.)
- **Components**: Only from direct child directories
- **Exception**: `Shared*` prefixed components can be imported from anywhere

### Memo Components

Components using `React.memo` must be prefixed with "Memo":
```tsx
// ❌ export const Button = memo(...)
// ✅ export const MemoButton = memo(...)
```

Memo components **cannot** use context hooks—only props.

Memo components should only accept **primitive props** (strings, numbers, booleans). Never pass objects, arrays, or functions—these change reference equality and defeat memoization:
```tsx
// ❌ <MemoItem data={{ id: 1 }} onClick={() => {}} />
// ✅ <MemoItem id={1} name="Item" isActive={true} />
```

### Context Providers

Providers must be in separate `*Provider.tsx` files, not inline in components.

## Index File Exports

Only export:
- Components
- Context and context hooks

Do **not** export from index:
- `use*.ts` state hooks
- Helper functions
- Types (unless needed externally)
