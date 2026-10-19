# Loan Eligibility Simulator

Frontend React application that walks a user through choosing a loan, entering personal and financial details, and reviewing a **demo** eligibility outcome. API behaviour is provided in the browser by [MSW](https://mswjs.io/); this repository does not include a backend, database, real credit bureau, or final loan approval.

Supporting material (requirements, endpoint shapes, foundation notes, and implementation plans) lives under [`documents/`](documents/) and [`tmp/foundation/`](tmp/foundation/). This README describes the **current** code.

---

## 1. Project overview

### Purpose

Help someone explore whether a personal or vehicle loan _could_ fit their budget under demo rules. The app collects loan selection and applicant details, posts them to mock loan APIs, and shows an eligibility estimate with recommended loan figures and affordability indicators.

### Implemented features

- Three-step journey: **Your loan** → **Your details** → **Eligibility**
- Catalog boot: products and validation rules loaded from the API before Screen 1 is usable
- Product accordion with purpose selection, amount, and term (bounds from validation rules / product catalog)
- Personal and financial forms driven by API validation rules (React Hook Form + Zod)
- Optional simulated credit-check consent and scenario selection (`bad` / `good` / `over_limit`)
- Eligibility check with loading, failure messaging, retry via resubmit, and abort of in-flight requests
- Result screen for eligible and ineligible outcomes, recommended loan panel, affordability visuals, risk category
- Session-scoped journey persistence (`sessionStorage`) so refresh and Back keep drafts within the tab
- Docker Compose packaging (nginx static host + MSW in the browser)
- Unit/component tests (Vitest), coverage thresholds in CI, Playwright smoke e2e

### Repayment estimates vs eligibility vs approval

| Concept                    | What this app does                                                                                                                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repayment / rate quote** | `POST /api/loans/calculate-rate` is implemented as a service and MSW handler (including a payment schedule). The journey screens **do not call it today**. Monthly repayment and total cost shown on the result screen come from the **eligibility** response’s `recommendedLoan` fields. |
| **Eligibility result**     | `POST /api/loans/eligibility` returns a demo decision (`isEligible`, `decisionReason`, risk, affordability analysis, recommended loan). An ineligible outcome is a successful API response, not an HTTP error.                                                                            |
| **Final loan approval**    | Not implemented. The result screen states that eligibility is an estimate and final approval is subject to verification. There is no application submission, underwriting, or disbursement.                                                                                               |

---

## 2. Quick start with Docker

This is the fastest path for an assessor. **Node.js is not required on the host.**

### Prerequisites

- Docker with Compose support (`docker compose`)

### Environment-file preparation

None required on the host. Compose passes build-time Vite variables as Docker build args (see [Environment variables](#12-environment-variables)).

### Build and run

```bash
docker compose up --build -d
```

Open **http://localhost:8080**.

### Stop, logs, rebuild

```bash
docker compose logs -f
docker compose down
docker compose up --build -d
```

### What runs in the container

| Layer                                   | Role                                                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build stage (`node:20-alpine`)          | `npm ci` + `npm run build`                                                                                                                                                                             |
| Runtime (`nginxinc/nginx-unprivileged`) | Serves `dist/` on port **8080**                                                                                                                                                                        |
| MSW                                     | Runs **in the user’s browser** after the SPA loads (`src/main.tsx` registers `public/mockServiceWorker.js`). nginx only serves the worker file and static assets; it does not implement the loan APIs. |

Client-side navigations fall back to `index.html` ([`nginx/default.conf`](nginx/default.conf)).

---

## 3. Local development

Use this when changing code. Distinct from Docker (port **8080**) and from production preview / e2e (port **4173**).

### Prerequisites

- **Node.js** `>=20` ([`package.json` `engines`](package.json); verified locally with Node 20.x)
- **npm** (lockfile is `package-lock.json`, lockfileVersion 3)

### Install

```bash
npm install
```

### Environment-file setup

- Day-to-day `npm run dev`: no `.env` file is required. API base defaults to `/api` when `VITE_API_BASE_URL` is unset.
- E2E / mock-mode build uses [`.env.e2e`](.env.e2e) via `npm run build:e2e` (`VITE_API_BASE_URL=/api`, `VITE_ENABLE_MOCK_API=true`).

MSW starts for every non-`test` Vite mode (including `development` and production builds). See [API and mocking](#8-api-and-mocking).

### Development server

```bash
npm run dev
```

Open the URL Vite prints (default **http://localhost:5173**).

### Production build and preview (local)

```bash
npm run build
npm run preview
```

Vite preview defaults to **http://localhost:4173**. Playwright’s config also targets `127.0.0.1:4173`.

| Mode                    | Typical URL           | Notes                            |
| ----------------------- | --------------------- | -------------------------------- |
| Docker                  | http://localhost:8080 | Static nginx image; no host Node |
| `npm run dev`           | http://localhost:5173 | HMR; MSW in browser              |
| `npm run preview` / e2e | http://localhost:4173 | Built assets; MSW in browser     |

---

## 4. Available commands

Scripts from [`package.json`](package.json):

| Script      | Command                                   | Purpose                          | Notes                                                                 |
| ----------- | ----------------------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| Development | `npm run dev`                             | Vite dev server                  | Remains running until stopped                                         |
| Build       | `npm run build`                           | `tsc -b` + Vite production build | Output in `dist/`                                                     |
| Preview     | `npm run preview`                         | Serve production build           | Remains running; default port 4173                                    |
| Typecheck   | `npm run typecheck`                       | `tsc -b --pretty false`          | Same project references as build                                      |
| Lint        | `npm run lint`                            | ESLint                           |                                                                       |
| Format      | `npm run format` / `npm run format:check` | Prettier write / check           |                                                                       |
| Unit tests  | `npm test`                                | Vitest single run                | No coverage gate                                                      |
| Coverage    | `npm run test:coverage`                   | Vitest + thresholds              | What CI **Quality** runs                                              |
| Watch tests | `npm run test:watch`                      | Vitest watch                     | Remains running                                                       |
| E2E build   | `npm run build:e2e`                       | Build with `.env.e2e`            | Used by Playwright locally/CI                                         |
| E2E         | `npm run test:e2e`                        | Playwright (Chromium)            | First time: `npx playwright install chromium` (CI uses `--with-deps`) |
| E2E UI      | `npm run test:e2e:ui`                     | Playwright UI mode               | Remains running                                                       |

**Accessibility:** there is no separate `a11y` npm script. Automated axe checks run inside Vitest where present (for example Loan Details via `vitest-axe`). See [Accessibility and responsiveness](#10-accessibility-and-responsiveness).

CI mirrors these steps in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Details: [`tmp/foundation/ci-and-quality-gates.md`](tmp/foundation/ci-and-quality-gates.md).

---

## 5. How it works

Stepper labels: **Your loan** → **Your details** → **Eligibility** ([`JourneyLayout`](src/components/journey-layout/JourneyLayout.tsx)). Completed steps are clickable to jump back.

### Screen 1: Your loan (`LoanDetailsScreen`)

- On first load, `App` fetches **products** and **validation rules**; loading and retry UI wrap the journey shell.
- Products (Personal Loan, Vehicle Finance) expand one at a time; purposes come from each product’s API `purposes` list.
- Selecting a purpose selects the parent product. Switching product clears amount and term.
- Amount and term helper text show product-specific allowed ranges from validation rules (falling back to product catalog bounds if a rules entry is missing).
- Primary action: **Continue to your details** (form submit). Validation runs on blur and on submit; first invalid field is focused.
- **No** call to `calculate-rate` or credit-check on this screen (covered by tests). Summary panel shows product, purpose, amount, and term labels only.
- **Back from Screen 2** restores the same Redux drafts (and session storage). Continuing again after unchanged inputs simply re-validates and advances; there is no separate “recalculate repayments” action on Screen 1.

### Screen 2: Your details (`YourDetailsScreen`)

- Requires a complete loan selection; otherwise shows an alert and **Return to your loan**.
- **Personal:** age, employment status; employment duration only for `employed` / `self_employed`.
- **Financial:** monthly income, monthly expenses (required); existing debt (optional; blank treated as `0` on submit).
- **Credit:** consent checkbox (“I consent to a credit bureau check”) plus demo scenario radios (**Poor credit** / **Good credit** / **Score above supported range.**). Helper text states no real credit check is performed. Default scenario is `good`.
- Manual numeric credit-score entry is **not** exposed in the UI (Redux still has `manualCreditScore` for the effective-score helper).
- Primary action: **Check eligibility** (or **View result** when a stored eligibility result still matches current inputs — no re-fetch).
- When consent is on, the app calls credit-check then eligibility (with `AbortController` + request generation guards). A failed credit check still continues to eligibility without a score (`creditCheckFailed`); eligibility HTTP failures stay on the screen with an error; success navigates to Screen 3. Changing the credit scenario clears any stored eligibility result.
- Income is labelled **Monthly take-home income**; budget calculations use take-home income.
- Loading: button shows “Checking eligibility…”, `aria-busy`, and a polite live status for assistive tech.
- **Back** returns to Screen 1 without clearing drafts.

There is **no** repayment estimate panel or payment-schedule table on this screen.

### Screen 3: Eligibility result (`YourResultScreen`)

- **Eligible / ineligible** banner with API `decisionReason`. Green success only when eligible with Low overall risk and Good affordability; other eligible outcomes (including incomplete credit assessment) use a neutral banner; mandatory ineligible keeps the unsuccessful style. Eligible heading: **You meet the initial eligibility criteria**. Invalid credit responses use an assessment-error heading (**We could not complete your assessment**) and hide the loan/affordability panels.
- **Recommended loan** panel: product, purpose, requested amount; **Estimated repayment for your requested loan** when calculated (including some ineligible outcomes); recommended amount and **Maximum amount based on your budget** only when an offer exists.
- **Affordability at a glance:** take-home income, budget composition bar (expenses / existing monthly debt repayments / new repayment / remaining monthly income), DTI, **Requested loan-to-annual-income ratio** (or **Not available**), categorical `affordabilityScore` (Good / Fair / Poor), **Simulated approval estimate** (credit-score-only mock rule, or **Not available**), overall risk (Low / Medium / High / Not fully assessed).
- Disclaimer notice: eligibility is an estimate; final approval is subject to verification.
- If the stored result no longer matches current inputs, or is missing: **Result unavailable** with return to details.
- **Back** → Your details. **Start again** → `resetJourney()` (clears journey state and, via store subscription, session storage), returning to Screen 1 empty.

---

## 6. Approach, thought process, and design decisions

This section records engineering judgement grounded in the current code and existing docs ([`documents/plans/2026-10-12-api-driven-frontend.md`](documents/plans/2026-10-12-api-driven-frontend.md), [`documents/Loan_Eligibility_Simulator_Frontend_Requirements.md`](documents/Loan_Eligibility_Simulator_Frontend_Requirements.md), [`tmp/foundation/`](tmp/foundation/)). Where a rationale is not stated in those sources, it is flagged for author confirmation.

### User journey

| Topic           | Detail                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Problem**     | Eligibility needs loan context plus personal/financial inputs; mixing everything on one page increases cognitive load. |
| **Approach**    | Three steps with a progress stepper; loan selection first, applicant details second, result third.                     |
| **Why it fits** | Matches the assessment journey and keeps each screen to one primary task.                                              |
| **Trade-off**   | Users cannot adjust amount/term on the result screen in place; they use Back / Start again.                            |

**Repayment calculation vs eligibility as separate operations:** the API contract separates `calculate-rate` and `eligibility`. The frontend keeps typed services for both. **Current UI prioritises eligibility only** for money outcomes on Screen 3; Screen 1 continues without a rate quote. _Author confirmation:_ whether omitting Screen 1 rate quotes was intentional scope cut or unfinished wiring relative to the API-driven plan.

### API-driven behaviour

| Topic                        | Detail                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**                  | Hardcoding products, limits, and eligibility policy in components duplicates the backend contract and drifts.                                                                                                                                                                                                                                                                                                             |
| **Approach**                 | Load products and validation rules at boot; build Zod schemas from rules + selected product; post eligibility (and optional credit-check) through service adapters that narrow responses.                                                                                                                                                                                                                                 |
| **Why it fits**              | Presentation components stay free of lending thresholds; mock handlers own demo policy ([`src/mocks/logic/`](src/mocks/logic/)).                                                                                                                                                                                                                                                                                          |
| **Contract inconsistencies** | Endpoint sample and mock fixtures are not always identical (for example age `max` **60** in mock rules vs “18 and 65” in the sample error string; eligibility scoring uses 18–65). UI trusts **runtime** validation-rules and product payloads. Mock loan-detail rules are generated from the product catalog so amount/term messages match products (cleaner than the sample vehicle_loan messages in the endpoint doc). |

### Mocking approach

| Topic           | Detail                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Problem**     | Frontend assessment needs realistic HTTP without standing up Express or a second Node server.                                                                                                                                                                                                                      |
| **Approach**    | MSW 2 browser worker intercepts `/api/loans/*` (plan constraint: keep MSW; do not add a second server).                                                                                                                                                                                                            |
| **Why it fits** | Same `fetch` paths work in dev, preview, Docker, and e2e.                                                                                                                                                                                                                                                          |
| **Trade-off**   | No real bureau or durable server; demo scores and decisions are local mock logic.                                                                                                                                                                                                                                  |
| **Real API**    | Services already use `VITE_API_BASE_URL` + relative `/loans/...` paths. Pointing that base at a real gateway and stopping MSW would be the seam — **MSW currently always starts** except in Vitest (`MODE === 'test'`). `VITE_ENABLE_MOCK_API` is set in Docker/e2e but **is not read** by application code today. |

### State management

| Topic            | Detail                                                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**      | Loan selection, drafts, and results must survive Back and screen switches without syncing every keystroke into global state as the sole form owner.                                                         |
| **Approach**     | Redux Toolkit holds cross-screen journey + catalog; React Hook Form owns active editing, touch, and field errors; drafts are mirrored into Redux on change for persistence/navigation.                      |
| **Persistence**  | `sessionStorage` key `loanEligibility.journey.v1` (best-effort). Refresh in the same tab restores journey; closing the tab clears it. Not `localStorage` / redux-persist.                                   |
| **Invalidation** | Changing loan, personal, financial, or credit inputs clears stored **eligibility** (and related inputs). Rate-quote fields exist in the slice for a Calculate/Recalculate flow that is not wired in the UI. |
| **Matching**     | Results are shown only when stored `eligibilityInputs` deeply match current drafts (`selectEligibilityMatchesCurrentInputs`).                                                                               |

### Forms and validation

| Topic         | Detail                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Problem**   | Users need early feedback without wiping entries; bounds come from the API.                                                                                  |
| **Approach**  | `mode: 'onBlur'`, `reValidateMode: 'onChange'`; errors shown after touch or submit; Zod schemas from [`buildFormSchemas.ts`](src/utils/buildFormSchemas.ts). |
| **Trade-off** | Optional credit score rules exist in the API payload but no manual score field is rendered; score arrives only via optional credit-check.                    |

### Component and styling approach

| Topic                | Detail                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Approach**         | Shared UI primitives under `src/components/ui/`; domain composites beside screens; SCSS Modules + tokens/mixins in [`src/styles/`](src/styles/).                          |
| **Why SCSS Modules** | Local class names, shared tokens, no CSS-in-JS runtime (see [`tmp/foundation/design-tokens-and-styling.md`](tmp/foundation/design-tokens-and-styling.md)).                |
| **Responsive**       | Layout modules stack columns on narrower viewports; touch-oriented control heights and 16px inputs on small screens to reduce mobile focus zoom (tokens / global styles). |

### Accessibility

Implemented patterns include: skip link; labelled controls with `aria-invalid` / `aria-describedby` where wired; progress `nav` with current/completed/upcoming announcements; dialog focus trap and restore; `focus-visible` styling; `prefers-reduced-motion` for ring animation and global motion; loading `role="status"`; Loan Details axe smoke in unit tests.

**Not claimed:** full WCAG 2.2 AA conformance from automation alone. Remaining backlog items are listed in [`documents/plans/2026-10-15-accessibility-corrections.md`](documents/plans/2026-10-15-accessibility-corrections.md). Manual screen-reader and zoom sign-off are not recorded as completed in-repo.

### Reliability

| Behaviour                          | Implementation                                                       |
| ---------------------------------- | -------------------------------------------------------------------- |
| Catalog load failure               | Error panel + Retry                                                  |
| Eligibility / credit-check failure | Inline error; stay on Screen 2                                       |
| Duplicate submit                   | `isSubmittingRef` guard                                              |
| Late / superseded responses        | Request generation counter; ignore stale completions                 |
| Unmount during request             | AbortController cleanup                                              |
| Forced eligibility 500             | `sessionStorage` key `mockApi.eligibilityFail` = `'1'` (MSW handler) |

### Scope and trade-offs

**Prioritised:** API-shaped services and mocks, three-screen journey, validation from rules, eligibility UX, Docker assessor path, strong unit coverage and CI gates.

**Deliberately excluded / not present:** real backend, auth, PII collection (names, ID, contacts), real credit bureau, fees/insurance, payment-schedule UI, Screen 1 calculate-rate UX, full Playwright journey automation (smoke only).

**Could improve with more time:** wire or remove unused rate-quote UI/state; gate MSW with `VITE_ENABLE_MOCK_API`; align age bounds across rules, messages, and scoring; expand e2e through eligible/ineligible/failure paths; finish accessibility checklist and manual verification.

**Complexity avoided:** no second Node server, no speculative plugin framework, relative imports only, demo policy confined to MSW logic modules.

---

## 7. Architecture and project structure

```text
src/
  screens/           Journey screens (loan details, your details, result)
  components/        Domain composites + ui/ primitives
  services/          Typed fetch adapters for loan APIs
  store/             Redux store, catalog + journey slices, session persistence
  utils/             Form schemas, labels, money/percent formatting
  mocks/             MSW worker, handlers, fixtures, demo scoring/amortisation
  types/             API TypeScript contracts
  styles/            SCSS tokens, mixins, global styles
  test/              Vitest setup, render helpers
  App.tsx            Catalog boot + screen switch
  main.tsx           MSW start + React root
e2e/                 Playwright specs and helpers
documents/           Requirements, endpoints, plans
tmp/foundation/      Design-system and CI reference notes
nginx/               Runtime nginx config for Docker
Dockerfile           Multi-stage Node build + nginx
compose.yaml         Assessor-facing Compose service
```

### Responsibilities

| Area              | Responsibility                                                 |
| ----------------- | -------------------------------------------------------------- |
| Screens           | Compose layout, forms, and navigation for each step            |
| Shared components | Reusable UI and result visuals                                 |
| API services      | HTTP + response narrowing → `{ ok }` results                   |
| Redux             | Catalog status; journey drafts, quotes, eligibility, screen id |
| Form schemas      | Zod from validation rules + product                            |
| MSW               | Intercept `/api/loans/*`; demo policy                          |
| Formatting utils  | Rand money, percent, human-readable labels                     |
| SCSS              | Tokens and per-component modules                               |
| Tests             | Behaviour-named unit/component tests; Playwright smoke         |

### Request flow

1. User edits forms (RHF) → drafts mirrored to Redux → saved to `sessionStorage`.
2. Actions call `services/*` → `fetch` to `VITE_API_BASE_URL` + `/loans/...`.
3. MSW handles the request in the browser → JSON response.
4. Screen stores successful eligibility (with input snapshot) and renders Screen 3 panels.

---

## 8. API and mocking

Endpoint shapes: [`documents/LoanEligibilitySimulatorEndpoints.md`](documents/LoanEligibilitySimulatorEndpoints.md). Credit-check is implemented in code though not listed in that sample doc.

| Method | Path                          | Purpose                                                               |
| ------ | ----------------------------- | --------------------------------------------------------------------- |
| `GET`  | `/api/loans/products`         | Loan product catalog                                                  |
| `GET`  | `/api/loans/validation-rules` | Form bounds and messages                                              |
| `POST` | `/api/loans/credit-check`     | Demo score for scenario `bad` \| `good` \| `over_limit`               |
| `POST` | `/api/loans/calculate-rate`   | Interest, payments, schedule (service + MSW; **not used by screens**) |
| `POST` | `/api/loans/eligibility`      | Demo eligibility + recommended loan + affordability                   |

### How MSW starts

[`src/main.tsx`](src/main.tsx) imports [`src/mocks/browser.ts`](src/mocks/browser.ts) and calls `worker.start` unless `import.meta.env.MODE === 'test'`. Unhandled requests `bypass`. Worker URL: `${import.meta.env.BASE_URL}mockServiceWorker.js` (file in [`public/`](public/)).

Vitest uses [`src/mocks/server.ts`](src/mocks/server.ts) via [`src/test/setup.ts`](src/test/setup.ts).

### Development vs Docker / production

| Context                        | Behaviour                                  |
| ------------------------------ | ------------------------------------------ |
| `npm run dev`                  | MSW on; Vite defaults                      |
| `npm run build` / Docker image | MSW still starts in the browser after load |
| Vitest                         | MSW server; browser worker skipped         |

There is **no** separate backend container.

### Credit-check scenarios

| `state`      | UI label                     | Fixed demo score | Credit risk / outcome                                      |
| ------------ | ---------------------------- | ---------------- | ---------------------------------------------------------- |
| `bad`        | Poor credit                  | **520**          | High credit risk (&lt; 650), still a valid in-bounds score |
| `good`       | Good credit (default)        | **780**          | Low credit risk (≥ 750)                                    |
| `over_limit` | Score above supported range. | **900**          | Invalid credit response (above 850)                        |

Validation rules require credit score **300–850**. When a score is present and outside that range, eligibility returns `riskAssessmentStatus: invalid_credit_response` (assessment error — not a completed eligibility result). Consent off → eligibility is sent without `creditScore` (`missing_credit_data`). If the applicant consents and the credit-check request fails, Screen 2 **continues** to eligibility with `creditCheckFailed: true` (no score); overall risk is **Not fully assessed**.

### Eligibility, affordability, and overall risk (simulator application rules)

These are demo rules for this app — **not** a proprietary or institutional lending model.

| Concern                         | Meaning                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Eligibility**                 | Mandatory hard gates (age, income floor, employment duration when employed/self-employed, remaining income ≥ 0 after the estimated repayment). Poor affordability or High overall risk alone does **not** decline. Out-of-range scores are an assessment error, not a normal decline.                       |
| **Affordability**               | Comfort managing the proposed repayment from DTI (existing monthly debt repayments + new repayment) ÷ take-home income. Living expenses are excluded from DTI. **Good** ≤ 30%, **Fair** ≤ 45%, else **Poor**.                                                                                               |
| **Overall risk**                | When a usable in-bounds credit score exists: combine **credit risk** with affordability. Credit risk on the mock 300–850 scale: **Low** ≥ 750, **Medium** ≥ 650, else **High**. Overall risk table: Low×Good→Low; Low×Fair→Medium; Low×Poor→High; Medium×Good/Fair→Medium; Medium×Poor→High; High×any→High. |
| **Missing / failed credit**     | `riskCategory: null`, `riskAssessmentStatus: missing_credit_data` or `credit_check_failed` (distinct copy). UI shows **Not fully assessed**. Affordability is still calculated.                                                                                                                             |
| **Invalid credit response**     | `riskAssessmentStatus: invalid_credit_response`. UI shows an assessment error and does not render the completed loan/affordability panels.                                                                                                                                                                  |
| **Simulated approval estimate** | Credit-score-only mock rule when assessed and eligible: score &lt; 650 → **55%**; 650–749 → **70%**; ≥ 750 → **95%**. Missing, failed, invalid, or mandatory ineligible → `null` (**Not available**). Does **not** include affordability. A genuine `0` remains displayable.                                |
| **Requested loan-to-income**    | Requested principal ÷ annual take-home income × 100. `null` / **Not available** when income cannot support the ratio — not fabricated as 0% merely because there is no recommendation.                                                                                                                      |

Maximum recommended principal remains the budget-based amortised amount (available income before the new repayment, term, rate, product cap) — labelled **Maximum amount based on your budget**, not a comfortable borrowing suggestion. The estimated repayment for the requested loan is retained on completed assessments (including some ineligible outcomes) and is separate from whether a recommended offer exists.

### Triggering request failures

- Set `sessionStorage.setItem('mockApi.eligibilityFail', '1')` then check eligibility → MSW returns HTTP 500.
- Catalog failures can be simulated in tests by overriding handlers; there is no dedicated UI toggle for products/rules failures beyond Retry after a real failed fetch.

### Real backend / bureau

None. Credit check is explicitly demo-only in the UI copy.

### Real API configuration

- **Supported seam:** `VITE_API_BASE_URL` (build-time).
- **Not supported yet as a switch:** disabling MSW via `VITE_ENABLE_MOCK_API` (variable is present in Compose / `.env.e2e` but unused in `main.tsx`).

---

## 9. State, validation, and error handling

| Topic                    | Behaviour                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Retained between screens | Product, purpose, amount, term, personal/financial drafts, credit consent/scenario/score, eligibility result + input snapshot, current screen |
| Refresh                  | Same tab: restored from `sessionStorage`. New tab/session: empty initial journey                                                              |
| Result matching          | Display only when `eligibilityInputs` match current drafts                                                                                    |
| Invalidation             | Loan / personal / financial / credit changes clear eligibility result                                                                         |
| Start again              | Full `resetJourney()` to initial empty journey (Screen 1)                                                                                     |
| Validation timing        | Blur + submit; revalidate on change after errors                                                                                              |
| Error presentation       | Field `ErrorText` after touch/submit; submit-level errors for API failures                                                                    |
| Loading / empty          | Catalog loading status; empty product list message; result unavailable states                                                                 |
| Ineligible decision      | HTTP 200 with `isEligible: false` — rendered as an outcome, not a transport error                                                             |

---

## 10. Accessibility and responsiveness

### Implemented (code)

- Skip to main content
- Semantic headings, `main`, labelled progress navigation
- Form labels, required markers, helper/error association on primary fields
- Dialog: Escape, focus trap, restore focus to opener (tested)
- Keyboard-operable product accordion and purpose radios
- Focus move to Screen 1 / Screen 3 titles (and Screen 2 first field) on arrival
- Polite status for catalog loading and eligibility checking
- Budget composition bar exposes a text alternative via accessible name
- Circular progress respects `prefers-reduced-motion`
- Responsive stacking via SCSS layout modules; minimum control heights in tokens

### Verification status

| Check                                                | Status                                        |
| ---------------------------------------------------- | --------------------------------------------- |
| Vitest + `vitest-axe` on Loan Details default state  | Implemented in tests                          |
| Full three-screen axe / Playwright a11y suite        | Not present as a dedicated command            |
| Manual keyboard / screen reader / 200% zoom sign-off | Not recorded as complete in-repo              |
| WCAG 2.2 AA claim                                    | **Do not assume** from automated checks alone |

See [`documents/plans/2026-10-15-accessibility-corrections.md`](documents/plans/2026-10-15-accessibility-corrections.md) and [`tmp/foundation/focus-and-field-styling.md`](tmp/foundation/focus-and-field-styling.md).

---

## 11. Testing

### Layers

| Layer                   | Tooling                                    | Coverage focus                                                 |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Unit / component        | Vitest, Testing Library, jsdom, MSW server | Screens, components, services, store, mock logic, schemas      |
| Accessibility (partial) | `vitest-axe`                               | Selected screen smoke                                          |
| E2E                     | Playwright Chromium                        | App shell smoke after catalog load                             |
| CI                      | GitHub Actions                             | typecheck, lint, format check, coverage thresholds, build, e2e |

Coverage thresholds (from [`vite.config.ts`](vite.config.ts)): lines/functions/statements **97%**, branches **93%** (enforced by `npm run test:coverage`).

### Commands

```bash
npm test
npm run test:coverage
npm run test:watch
npx playwright install chromium   # first local e2e setup
npm run test:e2e
```

### Verification performed for this README

- `npm run typecheck` — passed
- `npm test` — **49** files, **275** tests passed
- `docker compose config` — valid; publishes **8080:8080**
- Coverage percentages and e2e run were **not** re-executed for this documentation pass beyond the unit suite above

### Reproducing the main journey (manual)

1. Open Docker **http://localhost:8080** or `npm run dev`.
2. Expand a product, choose a purpose, enter amount/term within helpers, **Continue to your details**.
3. Enter age, employment (and duration if employed/self-employed), income, expenses; optionally consent + scenario; **Check eligibility**.
4. Review eligible or ineligible result; **Back** or **Start again**.

**Eligible demo path (typical):** employed, duration ≥ 3, income well above expenses + debt, moderate loan amount; credit consent off, or consent on with **Good credit** (Low overall risk when affordability is also Good) or **Poor credit** (High credit risk — still eligible if hard gates pass).

**Ineligible demo path:** e.g. disposable income negative after estimated repayment (very high expenses/debt relative to income); age outside the scoring band used by the mock.

**Assessment error demo path:** credit consent on with **Score above supported range.** → invalid credit response (not a completed eligibility result).

**Request failure:** in DevTools console on the app origin:

```js
sessionStorage.setItem('mockApi.eligibilityFail', '1');
```

Then submit **Check eligibility** — expect an error on Screen 2. Clear with `sessionStorage.removeItem('mockApi.eligibilityFail')`.

### Reviewer checklist

- [ ] Docker `up --build` loads the app on port 8080 without host Node
- [ ] Catalog loads; retry works if you simulate failure in tests or network
- [ ] Screen 1 validates purpose/amount/term; Back from Screen 2 restores drafts
- [ ] Screen 2 optional credit consent runs credit-check before eligibility
- [ ] Eligible and ineligible outcomes both render with a decision reason
- [ ] Affordability rating is categorical (Good/Fair/Poor), not a fabricated numeric score
- [ ] Start again clears the journey
- [ ] `npm test` (and ideally `npm run test:coverage`) pass locally

---

## 12. Environment variables

Vite embeds `VITE_*` values **at build time**. Do not put secrets in them; this app has no private API keys.

| Name                   | Purpose                                         | Default                 | Required | When applied                                                       |
| ---------------------- | ----------------------------------------------- | ----------------------- | -------- | ------------------------------------------------------------------ |
| `VITE_API_BASE_URL`    | Base path for loan API calls (`getApiBaseUrl`)  | `/api` if empty/unset   | No       | Build-time (dev server reads env at start)                         |
| `VITE_ENABLE_MOCK_API` | Documented/parity flag in Docker and `.env.e2e` | `true` in those configs | No       | Build-time **string only today** — **not consulted** by `main.tsx` |

Compose/Dockerfile build args mirror the same names:

```bash
docker compose build --build-arg VITE_API_BASE_URL=/api --build-arg VITE_ENABLE_MOCK_API=true
```

---

## 13. Limitations and future improvements

### Current limitations

- Frontend-only; MSW demo APIs, not a production lending stack
- No real credit bureau, authentication, or application submission
- `calculate-rate` (and payment schedule) not surfaced in the journey UI
- Manual credit score field not in the UI despite store/helper support
- `VITE_ENABLE_MOCK_API` does not toggle mocking
- Age bounds/messages/scoring are not fully consistent across fixtures and mock logic
- Journey persistence is session-tab scoped only; not a server draft
- Playwright covers smoke load, not the full eligible/ineligible/failure paths (some e2e helpers still throw “not implemented”)
- Accessibility automation is partial; WCAG conformance is unverified end-to-end
- Older requirements text under `documents/` still describes pre-API single-product flows in places — prefer this README + code

### Future improvements (ideas only)

- Wire Screen 1 Calculate / Recalculate to `calculate-rate`, or remove unused quote state
- Honour `VITE_ENABLE_MOCK_API` (or equivalent) to attach a real API
- Expand Playwright to the full journey and failure injection
- Complete the accessibility corrections plan and record manual sign-off
- Align validation-rules, endpoint samples, and scoring constants

---

## 14. Troubleshooting

| Issue                                   | What to try                                                                                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port 8080 / 5173 / 4173 in use          | Stop the other process or change the published/mapped port                                                                                                                                          |
| Env surprises after Docker rebuild      | Rebuild with `--build`; Vite vars are compile-time                                                                                                                                                  |
| `npm install` failures                  | Use Node ≥ 20; delete `node_modules` and reinstall; prefer `npm ci` for lockfile fidelity                                                                                                           |
| MSW “not registered” / stale worker     | Unregister service workers for the origin in browser DevTools; hard-refresh; confirm `/mockServiceWorker.js` loads                                                                                  |
| Requests hit a real server unexpectedly | Confirm MSW worker is active; check `VITE_API_BASE_URL`; remember unhandled requests bypass MSW                                                                                                     |
| Docker build fails                      | Ensure Docker can reach the network for base images; run `docker compose build` and inspect the Node build stage logs                                                                               |
| Deployed under a subpath                | App uses Vite `BASE_URL` for the worker URL; configure Vite `base` and ensure the host serves `mockServiceWorker.js` with an appropriate `Service-Worker-Allowed` header (see nginx config pattern) |

---

## 15. Deployment

This repo ships a **static SPA** suitable for any static host or the included Docker image. No additional cloud pipeline is defined here beyond GitHub Actions CI.

| Topic              | Detail                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Build output       | `dist/` from `npm run build`                                                                                              |
| Hosting            | Serve static files; no Node runtime required at serve time                                                                |
| Client-side routes | Soft navigation is in-memory today (no React Router URLs). nginx `try_files` → `index.html` still supports refresh of `/` |
| Base path          | Default `/`. Adjust Vite `base` if hosting under a subpath; keep MSW worker reachable                                     |
| Mock API           | MSW runs in the browser for production builds as currently written                                                        |

Docker is the documented production-like packaging for assessors ([§2](#2-quick-start-with-docker)).

---

## Further reading

- [`documents/LoanEligibilitySimulatorEndpoints.md`](documents/LoanEligibilitySimulatorEndpoints.md) — API sample payloads
- [`documents/Loan_Eligibility_Simulator_Frontend_Requirements.md`](documents/Loan_Eligibility_Simulator_Frontend_Requirements.md) — product requirements (may lag code in places)
- [`documents/plans/2026-10-12-api-driven-frontend.md`](documents/plans/2026-10-12-api-driven-frontend.md) — API-driven architecture plan
- [`tmp/foundation/README.md`](tmp/foundation/README.md) — tokens, primitives, CI, e2e foundation
