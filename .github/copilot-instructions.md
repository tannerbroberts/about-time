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
- **Exception**: Components in `src/Shared/` directory can be imported from anywhere

### Shared Components

Shared components must live in `src/Shared/` directory and **must be imported from at least 2 different files**. This ensures that shared components are actually shared and not just misplaced.

```
src/
  Shared/
    Button/
      Button.tsx      # Must be imported from 2+ files
      index.ts
```

If a component in `src/Shared/` is only used in one place, move it closer to where it's used.

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

## Primary Export Must Match Filename

The **first export statement** in any file determines its required filename. This is strictly enforced:

```tsx
// In file "calculateFoo.ts":
// ❌ First export is an interface - linter will complain
export interface FooConfig { ... }
export function calculateFoo(): FooConfig { ... }

// ✅ Function export comes first - matches filename
interface FooConfigType { ... }
export function calculateFoo(): FooConfigType { ... }
export type FooConfig = FooConfigType;  // Re-export type after function
```

**Strategy for utility files with types:**
1. Define interfaces/types as internal (no `export`)
2. Export the primary function first (must match filename)
3. Re-export types afterward using `export type Foo = FooInternal;`

## Import Ordering

Imports must be in this exact order with **blank lines between groups**:

```tsx
// 1. External packages (react, etc.)
import React from 'react';

// 2. Type imports from parent directories
import type { Template } from '../types';

// 3. Local imports from current directory
import { someUtil } from './someUtil';
import { useMyState } from './useMyState';
```

Parent directory imports (`../`) must come **before** local imports (`./`).

## Trailing Commas Required

Always use trailing commas in multi-line constructs:

```tsx
// ❌ Missing trailing comma
function foo(
  arg1: string,
  arg2: number
): void { }

// ✅ Trailing comma after last parameter
function foo(
  arg1: string,
  arg2: number,
): void { }

// Same for arrays, objects, and function calls
useMemo(
  (): Result => compute(),
  [dependency],  // ← trailing comma
);
```

## Line Length Limit: 100 Characters

Keep all lines under 100 characters. Strategies:

```tsx
// ❌ Too long
const { text: displayText, isTruncated } = truncateText(longVariableName, MAX_LENGTH);

// ✅ Break into multiple statements
const result = truncateText(longVariableName, MAX_LENGTH);
const displayText = result.text;
const isTruncated = result.isTruncated;

// ✅ Or use intermediate interface for destructuring
interface TruncateResult {
  text: string;
  isTruncated: boolean;
}
```

## Void Arrow Functions

Arrow functions returning `void` cannot use short-circuit evaluation:

```tsx
// ❌ Returns `false | void`, not assignable to `void`
onMouseEnter={(): void => condition && doSomething()}

// ✅ Use if statement inside block
onMouseEnter={(): void => {
  if (condition) doSomething();
}}
```

## No String Concatenation

Use template literals instead of `+` for strings:

```tsx
// ❌ String concatenation
return text.slice(0, max - 3) + '...';

// ✅ Template literal
return `${text.slice(0, max - 3)}...`;
```

## No Trailing Whitespace

JSDoc comments and all lines must have no trailing spaces:

```tsx
// ❌ Trailing space after asterisk on blank lines
/**
 * Description
 *
 * More text
 */

// ✅ No trailing whitespace (use empty line with just *)
/**
 * Description
 *
 * More text
 */
```

Note: The difference above is invisible but the first has a space after `*` on line 3.

