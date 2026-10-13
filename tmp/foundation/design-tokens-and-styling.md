# Design tokens and styling

Styling is **SCSS Modules** plus shared Sass tokens and mixins. There is no Tailwind, styled-components, or CSS-in-JS layer.

## Source files

| File                                                       | Role                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`src/styles/_tokens.scss`](../../src/styles/_tokens.scss) | Single source for colours, spacing, type, radii, layout, breakpoints, focus, motion      |
| [`src/styles/_mixins.scss`](../../src/styles/_mixins.scss) | Shared mixins (focus, fields, buttons, layout shells, screen type helpers)               |
| [`src/styles/global.scss`](../../src/styles/global.scss)   | Emits CSS variables, base reset/type, global `:focus-visible`, utilities, reduced-motion |
| [`src/main.tsx`](../../src/main.tsx)                       | Loads Nunito Sans (400 / 600 / 700) and `global.scss`                                    |

Component modules import tokens/mixins with relative `@use`, for example:

```scss
@use '../../../styles/mixins' as *;
@use '../../../styles/tokens' as *;
```

## Tokens

SCSS variables in `_tokens.scss` are the source of truth. The `emit-css-variables` mixin publishes matching custom properties on `:root` so runtime CSS (including `global.scss`) can use `var(--…)`.

### Colours (selected)

| Token                                               | Value                 | Notes                                  |
| --------------------------------------------------- | --------------------- | -------------------------------------- |
| `$color-primary`                                    | `#2f70ef`             | Confirmed brand primary                |
| `$color-primary-hover` / `$color-primary-pressed`   | `#245fd1` / `#1d4fb5` | Interactive states                     |
| `$color-page-bg`                                    | `#f3f7fb`             | Page background (`--color-background`) |
| `$color-surface`                                    | `#ffffff`             | Cards / controls                       |
| `$color-text` / `$color-text-secondary`             | `#121a33` / `#52627a` | Body and secondary                     |
| `$color-input-border` / `$color-input-hover-border` | `#8797ad` / `#63748d` | Field chrome                           |
| `$color-error` / `$color-error-border`              | `#b42318` / `#d92d20` | Invalid / error UI                     |
| `$color-success` / `$color-warning`                 | `#166534` / `#8a4b08` | Status colours                         |

Full set (success/warning surfaces, overlay, slider track, disabled, etc.) lives in `_tokens.scss`.

### Spacing, type, radii, layout

- **Spacing scale:** `$space-1` … `$space-8` (4px → 48px)
- **Font family:** `'Nunito Sans', 'Roboto', Arial, sans-serif`
- **Control / touch:** `$control-min-height: 48px`, `$touch-min: 44px`
- **Radii:** input `6px`, control `8px`, card `10px`, dialog `12px`, checkbox `4px`
- **Breakpoints:** `$bp-fields: 640px`, `$bp-stack: 960px`
- **Content widths:** e.g. `$content-max: 1200px`, `$dialog-max: 560px`

### Focus and motion tokens

| Token                                                           | Value                        |
| --------------------------------------------------------------- | ---------------------------- |
| `$focus-outline-width` / `$focus-outline-offset`                | `1px` / `2px`                |
| `$focus-outline-color`                                          | `$color-primary-pressed`     |
| `$focus-ring-width`                                             | `3px`                        |
| `$focus-ring-color`                                             | `rgba($color-primary, 0.35)` |
| `$focus-ring-color-invalid`                                     | `rgba($color-error, 0.25)`   |
| `$duration-color`                                               | `150ms`                      |
| `$duration-reveal` / `$duration-accordion` / `$duration-screen` | `180ms` / `200ms` / `200ms`  |
| `$duration-highlight`                                           | `250ms`                      |

Focus behaviour is documented in [Focus and field styling](./focus-and-field-styling.md).

### CSS variable aliases

`emit-css-variables` also sets back-compat aliases used during migration (e.g. `--color-text-muted`, `--color-border`, `--color-focus-ring`). Prefer the current names when adding new styles.

## Mixins (overview)

Shared in `_mixins.scss` (not an exhaustive API list of every screen helper):

| Mixin                                                                                 | Purpose                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `focus-ring`                                                                          | Outline focus ring                                |
| `respond-below` / `respond-above`                                                     | Breakpoint media queries                          |
| `content-shell`                                                                       | Max-width content + responsive horizontal padding |
| `card-surface`                                                                        | Surface card chrome                               |
| `button-base` / `button-primary` / `button-secondary` / `button-soft` / `button-text` | Button variants (`link` maps to `button-text`)    |
| `field-control` / `field-control-invalid`                                             | Text-field chrome and invalid focus               |
| `field-label`                                                                         | Label typography                                  |
| `screen-intro` / `screen-title` / `screen-description` / `section-heading`            | Shared type shells                                |
| `message-banner`                                                                      | Status banner layout                              |
| `tabular-nums`                                                                        | Tabular numeric figures                           |

## Global styles

[`global.scss`](../../src/styles/global.scss):

1. Calls `@include emit-css-variables`
2. Box-sizing reset; `html` font-size `87.5%` (14px when browser default is 16px)
3. Body uses CSS vars for font, colour, and page background
4. Global `:focus-visible { @include focus-ring; }`
5. Utility classes: `.helper-text`, `.error-text`, `.visually-hidden`
6. Mobile field font bump below `$bp-fields` for native inputs/selects/textareas
7. `prefers-reduced-motion: reduce` hard-cuts animations and transitions

## Fonts

Nunito Sans is loaded from **local** `@fontsource/nunito-sans` files (weights 400, 600, 700, `font-display: swap`) in `main.tsx`, not from a remote Google Fonts stylesheet. See the root README design decision: the app must still load when remote fonts are unavailable. Fallbacks remain `Roboto, Arial, sans-serif`.

## Related

- [UI primitives](./ui-primitives.md)
- [Focus and field styling](./focus-and-field-styling.md)
- [Component structure](./component-structure.md)
