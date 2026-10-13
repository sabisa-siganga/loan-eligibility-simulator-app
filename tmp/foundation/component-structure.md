# Component structure

## UI primitive folders

Each primitive under [`src/components/ui/`](../../src/components/ui/) uses a kebab-case folder and this file set:

```text
src/components/ui/<kebab-name>/
  <Name>.tsx
  <Name>.module.scss
  index.ts              # re-export component + types
  <Name>.test.tsx       # when present
```

Examples: `ui/button/Button.tsx`, `ui/input-group/InputGroup.tsx`, `ui/error-text/ErrorText.test.tsx`.

### Exports

- Named exports from each folder’s `index.ts` and from the barrel [`ui/index.ts`](../../src/components/ui/index.ts).
- Consumers import from `../ui` or a relative path to the folder — there is **no** `@/ui` (or similar) path alias in Vite.

### SCSS modules

- One `*.module.scss` colocated with the component.
- Shared look comes from `@use` of [`styles/tokens`](../../src/styles/_tokens.scss) and/or [`styles/mixins`](../../src/styles/_mixins.scss) with relative paths (depth depends on folder nesting).
- Local class names stay in the module; shared behaviour stays in mixins/tokens.

## Domain composites

Feature-level components under `src/components/<name>/` (outside `ui/`) follow the **same file pattern** (component + module + optional `index.ts` / tests) but are a different layer:

| Layer      | Location                 | Role                                                                                                                                 |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Primitives | `src/components/ui/`     | Reusable controls with little domain meaning                                                                                         |
| Composites | `src/components/<name>/` | Domain or app chrome built from primitives (e.g. money-input, whole-number-input, linked-slider-field, app-header, progress-stepper) |

Composites may use `export default` plus a named barrel; primitives prefer named exports through `ui/`.

## Screens

Screens live under `src/screens/<name>/` with the same colocated module/component pattern. This foundation set does **not** document screen logic or layout; see [Foundation README](./README.md) out-of-scope list.

## What we accept

- New primitives → new folder under `ui/` + barrel export in `ui/index.ts`
- New domain fields → composite under `src/components/`, composing `ui/` primitives
- Class merge via `[styles.x, className].filter(Boolean).join(' ')`
- Colocated unit tests next to the component when behaviour is non-trivial

## Related

- [UI primitives](./ui-primitives.md)
- [Design tokens and styling](./design-tokens-and-styling.md)
