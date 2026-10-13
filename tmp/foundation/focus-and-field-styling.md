# Focus and field styling

Two focus systems share tokens from [`_tokens.scss`](../../src/styles/_tokens.scss) and mixins from [`_mixins.scss`](../../src/styles/_mixins.scss).

## Tokens

| Token                                            | Role                                      |
| ------------------------------------------------ | ----------------------------------------- |
| `$focus-outline-width` / `$focus-outline-offset` | Outline ring geometry (`1px` / `2px`)     |
| `$focus-outline-color`                           | Outline colour (`$color-primary-pressed`) |
| `$focus-ring-width`                              | Field box-shadow ring width (`3px`)       |
| `$focus-ring-color`                              | Valid field glow (`rgba(primary, 0.35)`)  |
| `$focus-ring-color-invalid`                      | Invalid field glow (`rgba(error, 0.25)`)  |

Mirrored on `:root` as `--focus-outline-*`, `--focus-ring-*`, and `--color-focus-ring` (alias of the outline colour).

## 1. Outline ring (`focus-ring`)

Used for non-text controls and the global keyboard focus fallback:

```scss
@mixin focus-ring {
  outline: $focus-outline-width solid $focus-outline-color;
  outline-offset: $focus-outline-offset;
}
```

Applied by:

- Global `:focus-visible` in [`global.scss`](../../src/styles/global.scss)
- Button mixins (`button-base` `:focus-visible`)
- Checkbox and slider thumb modules (and similar controls that clear default outlines and re-apply `focus-ring`)

## 2. Box-shadow field ring (`field-control`)

Text fields and selects use border + soft glow instead of the outline ring:

| State         | Behaviour                                                                                |
| ------------- | ---------------------------------------------------------------------------------------- |
| Default       | `$color-input-border`, surface background, min-height `$control-min-height`              |
| Hover         | Darker border — **only when not** `:disabled`, `:read-only`, or `:focus`                 |
| Focus         | Border → `$color-primary`                                                                |
| Focus-visible | `outline: none`; border primary; `box-shadow: 0 0 0 $focus-ring-width $focus-ring-color` |
| Disabled      | Muted surface, disabled text, `not-allowed`                                              |
| Read-only     | Keeps white surface and readable text colour                                             |

Hover intentionally excludes `:focus` so hover’s higher specificity cannot override the focus border (commented in the mixin).

### Invalid (`field-control-invalid`)

Triggered in modules when the control has `aria-invalid='true'`:

```scss
.input {
  @include field-control;

  &[aria-invalid='true'] {
    @include field-control-invalid;
  }
}
```

Invalid state uses `$color-error-border` for border (including hover/focus) and `$focus-ring-color-invalid` for the focus-visible glow.

## InputGroup ownership

[`InputGroup.module.scss`](../../src/components/ui/input-group/InputGroup.module.scss) puts chrome on the **group**:

- `:focus-within` / `:focus-within:has(:focus-visible)` draw the border and glow on `.group`
- Inner `.control` clears its own outline/shadow so the group owns the ring
- Invalid group styling uses `:has([aria-invalid='true'])`

## What callers must do

- Set `aria-invalid="true"` (string) on the invalid control — do not invent a separate “error” class for the ring.
- Prefer `@include field-control` / `field-control-invalid` (or InputGroup) over one-off focus CSS.
- For buttons and non-field controls, keep `:focus-visible` on the outline `focus-ring` path.

## Related

- [Design tokens and styling](./design-tokens-and-styling.md)
- [UI primitives](./ui-primitives.md)
