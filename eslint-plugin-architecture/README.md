# eslint-plugin-architecture

Strict architectural ESLint rules for React/TypeScript projects.

## Rules

| Rule | Description |
|------|-------------|
| `no-react-hooks-in-components` | Disallow React hooks directly in component files |
| `named-exports-only` | Enforce named exports only, no default exports |
| `react-hooks-only-in-hook-files` | Restrict core hooks to hook files only |
| `memo-component-rules` | Enforce React.memo naming conventions |
| `context-provider-file` | Context providers must be in separate files |
| `component-folder-structure` | Enforce component folder structure |
| `import-boundaries` | Enforce import boundaries for components/context |
| `file-export-name-match` | File names must match export names |
| `no-useref-in-components` | Disallow useRef in component files |
| `memo-no-context-hooks` | Memo components cannot use context hooks |
