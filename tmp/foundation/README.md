# Foundation docs

Reference for how this frontend’s shared foundation is set up today: design tokens, UI primitives, styling and focus behaviour, component file layout, CI quality gates, and end-to-end test structure.

These docs describe **what the code already does**. They are not a redesign brief and they do not cover product journey logic.

## Out of scope

- Screen 1 / 2 / 3 business rules, validation policy, or eligibility calculations
- Visual or layout design of individual screens
- Planned or deferred product features

For install, run, and high-level stack notes, see the root [README](../../README.md).

## Reading order

1. [Design tokens and styling](./design-tokens-and-styling.md) — SCSS tokens, mixins, global styles
2. [UI primitives](./ui-primitives.md) — inventory and accepted conventions
3. [Focus and field styling](./focus-and-field-styling.md) — outline vs field focus rings, invalid state
4. [Component structure](./component-structure.md) — `ui/` folders vs domain composites
5. [CI and quality gates](./ci-and-quality-gates.md) — GitHub Actions, coverage, lint/format
6. [End-to-end tests](./end-to-end-tests.md) — Playwright layout and writing patterns

## Path map

| Area                                    | Location                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Tokens, mixins, global CSS              | [`src/styles/`](../../src/styles/)                                         |
| UI primitives                           | [`src/components/ui/`](../../src/components/ui/)                           |
| Domain composites (build on primitives) | [`src/components/`](../../src/components/) (outside `ui/`)                 |
| CI workflow                             | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)               |
| Unit / coverage config                  | [`vite.config.ts`](../../vite.config.ts)                                   |
| E2E specs and helpers                   | [`e2e/`](../../e2e/), [`playwright.config.ts`](../../playwright.config.ts) |
