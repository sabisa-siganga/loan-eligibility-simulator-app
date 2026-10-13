# Loan Eligibility Simulator

Frontend-only React app that helps a user explore whether a personal loan could fit their monthly budget. This repository currently contains the project foundation only — loan screens, calculations and eligibility rules are not implemented yet.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Checks

| Script                 | Purpose                             |
| ---------------------- | ----------------------------------- |
| `npm run typecheck`    | TypeScript project references check |
| `npm run lint`         | ESLint                              |
| `npm run format:check` | Prettier check                      |
| `npm run format`       | Prettier write                      |
| `npm test`             | Vitest once (CI-friendly)           |
| `npm run test:watch`   | Vitest watch mode                   |
| `npm run build`        | Production typecheck + build        |
| `npm run preview`      | Preview the production build        |

## Confirmed starting values

Recorded for later screen implementation:

| Field                         | Starting value |
| ----------------------------- | -------------- |
| Loan amount                   | R5,000         |
| Repayment term                | 6 months       |
| Example annual interest rate  | 12.5%          |
| Loan purpose                  | Unselected     |
| Personal and financial fields | Empty          |

Cancel, Start again and reload will clear entered details, results, errors and generated credit scores, then restore these starting loan values. Do not prefill personal information from design mock examples.

## State ownership (for later implementation)

- **React Hook Form** owns active field editing, touched fields and field errors.
- **Redux** owns shared journey information, submitted step values and the generated credit score that survives navigation.
- Repayments, totals, budget balances and eligibility are derived from inputs — do not store the same calculated values in multiple places.
- Do not synchronise every field into Redux on each keystroke.
- Keep Redux state serialisable. Do not use `redux-persist` or `localStorage` for financial drafts.
- Keep financial information out of URLs, logs and analytics. No secrets or banking credentials belong in this project.

## Project layout

```text
src/
  components/   Reusable interface pieces
  screens/      Loan details, Your budget, Your result (later)
  hooks/        Shared form and journey behaviour (later)
  services/     Local mock services (later)
  store/        Redux configuration, slices, selectors, typed hooks
  utils/        Calculations, eligibility, validation, formatting (later)
  types/        Shared TypeScript types (later)
  styles/       Global styles and theme values
  test/         Shared test setup
  App.tsx
  main.tsx
```

SCSS Modules and tests stay beside the related components.

## Theme and typography

- Primary blue: `#2F70EF`
- White surfaces, light grey background, readable dark text
- Result states: green, amber and red, always with text or icons
- Font: locally served Nunito Sans (weights 400, 600, 700) with Roboto / Arial / sans-serif fallbacks
- Default body size: 14px (`0.875rem`), line-height 1.5
- On narrow touch devices, editable controls may use 16px to avoid browser focus zoom

## Scope boundaries

This app does not include a backend, database, authentication, real banking APIs, real credit checks or financial-data persistence. Future mock services will run locally in the frontend.
