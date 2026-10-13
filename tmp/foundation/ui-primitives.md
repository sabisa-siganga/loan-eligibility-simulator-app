# UI primitives

Primitives live under [`src/components/ui/`](../../src/components/ui/) and are re-exported from [`src/components/ui/index.ts`](../../src/components/ui/index.ts).

Domain composites (money input, linked slider field, app header, etc.) sit under `src/components/<name>/` and **compose** these primitives. They are not themselves `ui/` primitives.

## Inventory

| Primitive    | Path              | Notes                                                                 |
| ------------ | ----------------- | --------------------------------------------------------------------- |
| `Label`      | `ui/label/`       | Optional `required` → red `*` with `aria-hidden="true"`               |
| `HelperText` | `ui/helper-text/` | Secondary helper copy                                                 |
| `ErrorText`  | `ui/error-text/`  | Defaults `role="alert"`                                               |
| `Input`      | `ui/input/`       | Thin `<input>` wrapper; invalid via `aria-invalid`                    |
| `InputGroup` | `ui/input-group/` | Group chrome + `InputGroupInput`, `InputGroupAddon`, `InputGroupText` |
| `Button`     | `ui/button/`      | Variants: `primary` \| `secondary` \| `soft` \| `link`                |
| `Select`     | `ui/select/`      | Composed field (label + select + helper/error)                        |
| `Checkbox`   | `ui/checkbox/`    | Labelled checkbox control                                             |
| `Dialog`     | `ui/dialog/`      | Modal dialog with focus trap                                          |
| `Slider`     | `ui/slider/`      | Range control                                                         |

Global CSS utilities (not React components): `.helper-text`, `.error-text`, `.visually-hidden` in [`global.scss`](../../src/styles/global.scss).

## Requirements / what we accept

These conventions are already encoded in the primitives. New UI work should follow them.

### Props and wrappers

- Prefer thin wrappers that extend native element props via `ComponentPropsWithoutRef<'…'>` (e.g. `Input`, `Button`, `Label`, `ErrorText`).
- Use `forwardRef` and set `displayName` where the primitive exposes a DOM ref.
- Merge classes with `[styles.foo, className].filter(Boolean).join(' ')` — no `clsx` / `cn` utility in this repo.
- `Button` defaults: `variant='primary'`, `type='button'`.
- Some field composites (`Select`, `Checkbox`) take controlled domain props (`label`, `value`/`checked`, `onChange`) rather than raw HTML-only passthrough.

### Variants

- Named visual variants exist on **Button** only: `primary` | `secondary` | `soft` | `link`.
- Fields use state styling (default / hover / focus / disabled / read-only / invalid), not variant props.

### Accessibility

- **Invalid styling** is driven by `aria-invalid='true'` on the control (and InputGroup via `:has([aria-invalid='true'])`). See [Focus and field styling](./focus-and-field-styling.md).
- Field composites wire `htmlFor` / `id` (`useId` fallback when needed), `aria-describedby` for helper/error ids, and `aria-required` when required.
- `ErrorText` defaults to `role="alert"`.
- Decorative icons use `aria-hidden="true"`.
- Touch / control targets: `$touch-min` (44px), `$control-min-height` (48px) from tokens.

### Dialog baseline

[`Dialog`](../../src/components/ui/dialog/Dialog.tsx) provides:

- `role="dialog"`, `aria-modal`, `aria-labelledby`
- Escape to close
- Focus trap (Tab / Shift+Tab within focusable descendants)
- Body scroll lock while open
- Initial focus on the close button

### InputGroup markers

`data-slot` values used for structure: `input-group`, `input-group-control`, `input-group-addon`, `input-group-text`. Addon `align` is `'inline-start' | 'inline-end'`.

## Unit tests

Several primitives have colocated `*.test.tsx` files (Button, Input, InputGroup, Select, Dialog, ErrorText). Checkbox and Slider are excluded from coverage thresholds (see [CI and quality gates](./ci-and-quality-gates.md)); that is a coverage config choice, not a ban on adding tests.

## Related

- [Design tokens and styling](./design-tokens-and-styling.md)
- [Component structure](./component-structure.md)
- [Focus and field styling](./focus-and-field-styling.md)
