# End-to-end tests

Playwright exercises the built app under preview with the mock API enabled. This doc covers **how e2e is set up**, not product rules for individual screens.

## Tooling

| Item           | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Framework      | `@playwright/test`                                                           |
| Config         | [`playwright.config.ts`](../../playwright.config.ts)                         |
| Spec directory | `./e2e`                                                                      |
| Browser        | Chromium only (`Desktop Chrome` device)                                      |
| Base URL       | `http://127.0.0.1:4173`                                                      |
| Build for e2e  | `npm run build:e2e` → Vite `--mode e2e` (loads [`.env.e2e`](../../.env.e2e)) |

Mock env typically sets `VITE_ENABLE_MOCK_API=true` and `VITE_API_BASE_URL=/api`. First-time local setup: `npx playwright install chromium`.

## Layout

```text
e2e/
  helpers/journey.ts
  loan-details.spec.ts
  journey.happy-path.spec.ts
  journey.eligibility-failure.spec.ts
playwright.config.ts
```

There are no page-object classes. Shared navigation/fill/mock steps live in [`e2e/helpers/journey.ts`](../../e2e/helpers/journey.ts).

Helper surface today:

- `openLoanDetails`
- `continueToBudgetWithPurpose`
- `fillEmployedBudgetThatPasses`
- `enableEligibilityFailureMock` — sets `sessionStorage` key from `MOCK_ELIGIBILITY_FAIL_STORAGE_KEY` via `page.addInitScript`

## Config behaviour

| Setting               | Local                           | CI (`CI` set)                          |
| --------------------- | ------------------------------- | -------------------------------------- |
| `forbidOnly`          | false                           | true                                   |
| `retries`             | 0                               | 2                                      |
| `workers`             | default                         | 1                                      |
| reporters             | `list`                          | `list` + `html` (`open: 'never'`)      |
| `webServer`           | `build:e2e` then `vite preview` | assumes pre-built; `vite preview` only |
| `reuseExistingServer` | true                            | false                                  |
| webServer timeout     | 180s                            | 180s                                   |

`trace: 'on-first-retry'`. `fullyParallel: true`.

CI installs Chromium with deps, runs `build:e2e`, then `test:e2e`. On failure, the workflow uploads `playwright-report/`. See [CI and quality gates](./ci-and-quality-gates.md).

## Writing conventions

What we accept for new or updated e2e specs:

- Import `{ expect, test }` from `@playwright/test`
- Prefer accessible queries: `getByRole`, `getByLabel` (and similar)
- Use screen root `data-testid`s as **anchors** when waiting for a route/view (e.g. `loan-details-screen`, `your-budget-screen`, `your-result-screen`) — not as a substitute for role/label queries on controls
- Name tests after observable behaviour (`completes the journey…`, `blocks Continue without…`)
- Put repeated journey steps in `e2e/helpers/journey.ts` rather than copying long fill sequences
- Force a failed eligibility check with `enableEligibilityFailureMock` before the journey starts (storage key owned by `src/mocks/constants.ts`)

Unit tests stay in Vitest under `src/**`; Playwright does not run them. Vitest excludes `e2e/**`.

## Scripts

```bash
npm run build:e2e
npm run test:e2e
npm run test:e2e:ui
```

Locally, `test:e2e` also builds via the Playwright `webServer` command when no preview is already running.

## Related

- [CI and quality gates](./ci-and-quality-gates.md)
- Root [README](../../README.md) Mock API and Checks sections
