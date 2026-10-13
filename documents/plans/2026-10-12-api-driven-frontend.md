# API-Driven Frontend Implementation Plan

**Goal:** Make the frontend consume MSW-backed loan APIs for products, validation rules, credit check, rate calculation, and eligibility so those concerns are no longer owned by hardcoded client policy.

**Architecture:** Extend MSW to implement `GET/POST /api/loans/*`. Typed service adapters fetch and narrow responses. Forms build Zod schemas from validation-rules and selected product bounds. Screen 1 collects product + loan details + optional credit (opt-in credit-check), then explicit Calculate calls calculate-rate. Screen 2 collects personal/financial fields and posts eligibility. Screen 3 renders eligibility payload; Adjust re-calls calculate-rate and eligibility.

**Tech Stack:** React 19, Vite, TypeScript (strict), Redux Toolkit, React Hook Form, Zod, MSW 2, Vitest, Testing Library, Playwright.

## Global Constraints

- Node.js `>=20`; npm scripts already in `package.json`.
- Keep MSW as the mock backend; do **not** add Express or a second Node server.
- Wire enums and field names match `tmp/LoanEligibilitySimulatorEndpoints.md` (snake_case): e.g. `self_employed`, `home_improvement`, `personal_loan`.
- Paths: `GET /api/loans/products`, `GET /api/loans/validation-rules`, `POST /api/loans/credit-check`, `POST /api/loans/calculate-rate`, `POST /api/loans/eligibility`.
- `creditScore` is optional on calculate-rate and eligibility; when present, mock outcomes are more favourable.
- Credit UI: optional numeric field + separate “Run a credit check” control (calls credit-check immediately on opt-in). Effective score = entered value if set, else credit-check result, else omit.
- No live calculate-rate on every keystroke; only on explicit Calculate / Adjust.
- Product bounds win over validation-rules when both constrain amount/term/purpose.
- Slim budget form to API fields; remove income source / business-duration / “don’t know score” third path.
- Do **not** create git commits unless the user explicitly asks.
- Keep `npm run typecheck`, `npm run lint`, and `npm run test` green after each task where practical.
- Relative imports only (no `@/` alias).
- Airbnb-style TypeScript: `===`, `const`, named exports preferred, `unknown` over `any` at boundaries.

---

## File structure (target)

```
src/types/
  api.ts                         — request/response types for all loan endpoints

src/services/
  apiBase.ts                     — getApiBaseUrl helper (shared)
  products.ts                    — getProducts
  validationRules.ts             — getValidationRules
  creditCheck.ts                 — runCreditCheck
  calculateRate.ts               — calculateRate
  eligibility.ts                 — checkEligibility (replace old shape)
  (delete or rewrite old eligibility-only helpers as needed)

src/mocks/
  data/products.ts               — fixture catalog
  data/validationRules.ts        — fixture rules
  handlers/
    products.ts
    validationRules.ts
    creditCheck.ts
    calculateRate.ts
    eligibility.ts
  logic/
    amortise.ts                  — payment schedule + totals (used by handlers)
    scoreEligibility.ts          — eligibility decision for MSW
  handlers.ts                    — compose handlers
  constants.ts                   — fail-storage key (keep/rename)

src/utils/
  buildFormSchemas.ts            — Zod from validation-rules + product
  resolveEffectiveCreditScore.ts — entered vs credit-check vs omit
  (retire POLICY_THRESHOLDS / PRODUCT_SETTINGS as policy; keep formatMoney currency)

src/store/
  catalogSlice.ts                — products + validationRules + boot status
  journeySlice.ts                — reshape for API responses / product id / credit

src/screens/
  loan-details-screen/           — product select, credit, Calculate, estimate from API
  your-budget-screen/            — slim fields → eligibility
  your-result-screen/            — render eligibility; Adjust → rate + eligibility

src/App.tsx                      — boot catalog fetch / loading / retry
README.md                        — document endpoints + MSW
```

Reference shapes: `tmp/LoanEligibilitySimulatorEndpoints.md`.

---

### Task 1: API types and shared base URL

**Files:**

- Create: `src/types/api.ts`
- Create: `src/services/apiBase.ts`
- Test: `src/services/apiBase.test.ts`

**Interfaces:**

- Consumes: `import.meta.env.VITE_API_BASE_URL`
- Produces:
  - `getApiBaseUrl(): string`
  - Exported types: `LoanProduct`, `ProductsResponse`, `ValidationRulesResponse`, `CreditCheckResponse`, `CalculateRateRequest`, `CalculateRateResponse`, `EligibilityRequest`, `EligibilityResponse`, employment/purpose/product id string unions matching the endpoint doc

- [ ] **Step 1: Write failing test for base URL normalisation**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getApiBaseUrl } from './apiBase';

describe('getApiBaseUrl', () => {
  const original = import.meta.env.VITE_API_BASE_URL;

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = original;
  });

  it('strips a trailing slash from VITE_API_BASE_URL', () => {
    import.meta.env.VITE_API_BASE_URL = '/api/';
    expect(getApiBaseUrl()).toBe('/api');
  });

  it('defaults to /api when env is empty', () => {
    import.meta.env.VITE_API_BASE_URL = '';
    expect(getApiBaseUrl()).toBe('/api');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/services/apiBase.test.ts`  
Expected: FAIL (module missing)

- [ ] **Step 3: Implement `apiBase.ts` and `types/api.ts`**

`src/services/apiBase.ts`:

```ts
export const getApiBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (typeof base === 'string' && base.length > 0) {
    return base.replace(/\/$/, '');
  }
  return '/api';
};

export const loansApiPath = (suffix: string): string =>
  `${getApiBaseUrl()}/loans${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
```

`src/types/api.ts` — define types matching the endpoint doc, plus:

```ts
export type CreditCheckResponse = {
  creditScore: number;
};

export type CalculateRateRequest = {
  loanAmount: number;
  loanTerm: number;
  loanType: string;
  creditScore?: number;
};
```

Include full `EligibilityRequest` / `EligibilityResponse` / `LoanProduct` / validation rule field shapes from `tmp/LoanEligibilitySimulatorEndpoints.md`. Mark `financialInfo.creditScore` optional on eligibility request.

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/services/apiBase.test.ts`  
Expected: PASS

---

### Task 2: MSW product + validation-rules fixtures and handlers

**Files:**

- Create: `src/mocks/data/products.ts`
- Create: `src/mocks/data/validationRules.ts`
- Create: `src/mocks/handlers/products.ts`
- Create: `src/mocks/handlers/validationRules.ts`
- Modify: `src/mocks/handlers.ts`
- Test: `src/mocks/handlers/catalogHandlers.test.ts`

**Interfaces:**

- Consumes: types from `src/types/api.ts`
- Produces: MSW handlers for `GET */api/loans/products` and `GET */api/loans/validation-rules`

- [ ] **Step 1: Write failing test that GET products returns two products**

```ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handlers } from '../handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('catalog handlers', () => {
  it('returns personal_loan and vehicle_loan from GET /api/loans/products', async () => {
    const response = await fetch('/api/loans/products');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.products.map((p: { id: string }) => p.id)).toEqual([
      'personal_loan',
      'vehicle_loan',
    ]);
  });

  it('returns validation rules with optional creditScore', async () => {
    const response = await fetch('/api/loans/validation-rules');
    const body = await response.json();
    expect(body.financialInfo.creditScore.required).toBe(false);
    expect(body.personalInfo.employmentStatus.options).toContain('self_employed');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test -- src/mocks/handlers/catalogHandlers.test.ts`

- [ ] **Step 3: Add fixtures copied from endpoint samples**

`products.ts`: personal_loan + vehicle_loan objects exactly as in `tmp/LoanEligibilitySimulatorEndpoints.md`.  
`validationRules.ts`: personalInfo / financialInfo / loanDetails as in that file (`creditScore.required: false`).

- [ ] **Step 4: Wire handlers**

```ts
// src/mocks/handlers/products.ts
import { http, HttpResponse } from 'msw';
import { MOCK_PRODUCTS } from '../data/products';

export const productsHandlers = [
  http.get('*/api/loans/products', () => HttpResponse.json({ products: MOCK_PRODUCTS })),
];
```

Same pattern for validation-rules. Compose in `src/mocks/handlers.ts` (keep or temporarily keep old eligibility-check handler until Task 4 removes it).

- [ ] **Step 5: Run tests — expect PASS**

---

### Task 3: Amortisation helper + calculate-rate + credit-check handlers

**Files:**

- Create: `src/mocks/logic/amortise.ts`
- Create: `src/mocks/handlers/calculateRate.ts`
- Create: `src/mocks/handlers/creditCheck.ts`
- Modify: `src/mocks/handlers.ts`
- Test: `src/mocks/logic/amortise.test.ts`
- Test: `src/mocks/handlers/rateAndCreditHandlers.test.ts`

**Interfaces:**

- Consumes: `CalculateRateRequest`
- Produces:
  - `amortiseLoan({ principal, termMonths, annualRatePercent }) => CalculateRateResponse fields`
  - `POST */api/loans/calculate-rate` — optional `creditScore`
  - `POST */api/loans/credit-check` → `{ creditScore: number }` from fixed set `[620, 680, 720, 760]`

- [ ] **Step 1: Failing amortise test**

```ts
import { describe, expect, it } from 'vitest';
import { amortiseLoan, pickRatePercent } from './amortise';

describe('pickRatePercent', () => {
  it('returns a mid-band rate when creditScore is omitted', () => {
    expect(pickRatePercent({ loanType: 'personal_loan' })).toBe(14.5);
  });

  it('returns a lower rate when creditScore is high', () => {
    expect(pickRatePercent({ loanType: 'personal_loan', creditScore: 750 })).toBeLessThan(
      pickRatePercent({ loanType: 'personal_loan' }),
    );
  });
});

describe('amortiseLoan', () => {
  it('returns monthly payment and a schedule length equal to term', () => {
    const result = amortiseLoan({
      principal: 150_000,
      termMonths: 24,
      annualRatePercent: 12.5,
    });
    expect(result.paymentSchedule).toHaveLength(24);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.totalRepayment).toBeGreaterThan(result.monthlyPayment);
  });
});
```

- [ ] **Step 2: Implement amortise + rate picker**

Use standard amortising formula:

```ts
const monthlyRate = annualRatePercent / 100 / 12;
const payment =
  monthlyRate === 0
    ? principal / termMonths
    : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths);
```

Round money to 2 decimals. Build schedule month-by-month.  
`pickRatePercent`: use product interest bands (personal 10.5–18.5, vehicle 8.5–15.0); default mid-band without score; with score map 300–850 linearly toward the low end of the band.

- [ ] **Step 3: Handlers**

calculate-rate: parse JSON, validate required `loanAmount`, `loanTerm`, `loanType`; ignore missing creditScore; return amortise result.  
credit-check: `delay(300)` optional; return `{ creditScore: FIXED_SCORES[requestCount % length] }` or hash-stable pick.

- [ ] **Step 4: Integration tests via `setupServer`**

Assert calculate-rate works **without** `creditScore`, and with score yields `interestRate` ≤ without-score for same amount/term/type.  
Assert credit-check returns numeric `creditScore` in 300–850.

- [ ] **Step 5: Run tests — expect PASS**

---

### Task 4: Eligibility MSW handler

**Files:**

- Create: `src/mocks/logic/scoreEligibility.ts`
- Create: `src/mocks/handlers/eligibility.ts`
- Modify: `src/mocks/handlers.ts` — remove `POST */eligibility-check`
- Modify: `src/mocks/constants.ts` — keep fail key `mockApi.eligibilityFail`
- Test: `src/mocks/logic/scoreEligibility.test.ts`

**Interfaces:**

- Consumes: `EligibilityRequest`
- Produces: `EligibilityResponse`; if `sessionStorage.mockApi.eligibilityFail === '1'`, return HTTP 500 with stable message

- [ ] **Step 1: Failing unit tests for scoring**

```ts
it('marks ineligible when age is below 18', () => { ... });
it('returns higher approvalLikelihood when creditScore is present than when omitted', () => { ... });
it('includes recommendedLoan.monthlyPayment greater than 0 when eligible', () => { ... });
```

- [ ] **Step 2: Implement `scoreEligibility`**

Rules (mock, not production bureau):

- Fail if age &lt; 18 or &gt; 65, income &lt; 5000, employmentDuration &lt; 3 when status is `employed` or `self_employed`.
- Disposable income = income − expenses − existingDebt − estimated monthly payment (from amortise + pickRate).
- Fail if disposable &lt; 0.
- Base `approvalLikelihood` 55 without creditScore; +15 if creditScore ≥ 650; +25 if ≥ 750 (cap 95).
- `riskCategory`: high / medium / low from likelihood bands.
- Fill `recommendedLoan` and `affordabilityAnalysis` consistently with amounts in the request.

- [ ] **Step 3: HTTP handler**

`POST */api/loans/eligibility` — parse body, apply fail hook, return JSON.

- [ ] **Step 4: Remove old eligibility-check handler and update any import of `ELIGIBILITY_CHECK_PATH`**

- [ ] **Step 5: Run related tests — expect PASS**

---

### Task 5: Service adapters (all five endpoints)

**Files:**

- Create: `src/services/products.ts`
- Create: `src/services/validationRules.ts`
- Create: `src/services/creditCheck.ts`
- Create: `src/services/calculateRate.ts`
- Rewrite: `src/services/eligibility.ts`
- Test: rewrite `src/services/eligibility.test.ts` + add sibling service tests
- Delete unused exports from old eligibility shape (`requestId`-only)

**Interfaces:**

- Produces:
  - `getProducts(): Promise<{ ok: true; products: LoanProduct[] } | { ok: false; message: string }>`
  - `getValidationRules(): Promise<...>`
  - `runCreditCheck(options?: { signal?: AbortSignal }): Promise<{ ok: true; creditScore: number } | { ok: false; message: string }>`
  - `calculateRate(body: CalculateRateRequest, options?): Promise<...>`
  - `checkEligibility(body: EligibilityRequest, options?): Promise<{ ok: true; data: EligibilityResponse } | { ok: false; message: string }>`

Use type guards; never throw for expected HTTP/parse failures (AbortError may rethrow).

- [ ] **Step 1: Write failing tests with `vi.stubGlobal('fetch', ...)`** for one success and one malformed body per service (start with `calculateRate` omitting creditScore).

- [ ] **Step 2: Implement adapters using `loansApiPath('/products')` etc.**

- [ ] **Step 3: Run service tests — expect PASS**

- [ ] **Step 4: Fix compile errors in screens that still import old `checkEligibility({ requestId })` by temporarily stubbing call sites or completing Task 9–11 in the same change set if typecheck blocks — prefer finishing Task 6–8 first if screens still compile via old types; otherwise update call sites to compile with `// temporary` only if unavoidable. Prefer Task 9 store + screen updates soon after.**

---

### Task 6: Dynamic Zod schemas from validation-rules + product

**Files:**

- Create: `src/utils/buildFormSchemas.ts`
- Create: `src/utils/resolveEffectiveCreditScore.ts`
- Test: `src/utils/buildFormSchemas.test.ts`
- Test: `src/utils/resolveEffectiveCreditScore.test.ts`

**Interfaces:**

- Consumes: `ValidationRulesResponse`, `LoanProduct`
- Produces:
  - `buildLoanDetailsSchema({ rules, product })` → Zod schema for amount, term, purpose, optional creditScore
  - `buildBudgetSchema({ rules })` → Zod for age, employmentStatus, employmentDuration, monthlyIncome, monthlyExpenses, existingDebt
  - `resolveEffectiveCreditScore({ entered, creditCheckScore }): number | undefined`

- [ ] **Step 1: Failing tests**

```ts
it('rejects amount below the selected product minAmount even if validation-rules min is lower', () => {});
it('uses errorMessage from validation-rules for age', () => {});
it('allows omitting creditScore', () => {});
it('prefers entered credit score over credit-check score', () => {
  expect(resolveEffectiveCreditScore({ entered: 700, creditCheckScore: 620 })).toBe(700);
});
it('uses credit-check score when entered is null', () => {
  expect(resolveEffectiveCreditScore({ entered: null, creditCheckScore: 620 })).toBe(620);
});
```

- [ ] **Step 2: Implement builders**

For amount/term: `effectiveMin = max(rulesMin, product.minAmount)` (and max → `min(rulesMax, product.maxAmount)` when both defined).  
Purpose: `z.enum` from `product.purposes`.  
Employment options from `rules.personalInfo.employmentStatus.options`.

- [ ] **Step 3: Run tests — expect PASS**

---

### Task 7: Catalog slice + App boot load

**Files:**

- Create: `src/store/catalogSlice.ts`
- Modify: `src/store/store.ts`
- Modify: `src/App.tsx`
- Test: `src/store/catalogSlice.test.ts`
- Test: update `src/App.test.tsx`

**Interfaces:**

- Produces catalog state: `{ status: 'idle'|'loading'|'ready'|'error'; products; validationRules; errorMessage }`
- Actions: `catalogLoadStarted`, `catalogLoadSucceeded`, `catalogLoadFailed`
- App on mount dispatches load (thunk or `useEffect` calling services)

- [ ] **Step 1: Slice tests for success/failure transitions**

- [ ] **Step 2: Implement slice + register in store**

- [ ] **Step 3: App loads catalog before showing Screen 1**

```tsx
// Pseudostructure
if (catalog.status === 'loading' || catalog.status === 'idle') return <p>Loading…</p>;
if (catalog.status === 'error') return <button onClick={retry}>Retry</button>;
// existing journey UI
```

- [ ] **Step 4: Tests with mocked `getProducts` / `getValidationRules`**

- [ ] **Step 5: Run unit tests — expect PASS**

---

### Task 8: Reshape journey Redux state for API responses

**Files:**

- Modify: `src/store/journeySlice.ts`
- Modify: `src/store/journeySelectors.ts`
- Modify: `src/store/journeySlice.test.ts`
- Modify: `src/types/loan.ts` / `src/types/budget.ts` — align submitted shapes to API field names (snake_case values)

**Interfaces:**

- Journey state fields (replace old demo/eligibility ping fields as needed):
  - `selectedProductId: string | null`
  - `submittedLoanDetails: { amount; termMonths; purpose; loanType } | null`
  - `effectiveCreditScore: number | null`
  - `creditCheckScore: number | null`
  - `rateQuote: CalculateRateResponse | null`
  - `eligibilityResult: EligibilityResponse | null`
  - `eligibilityStatus`, `eligibilityError`
- Actions: `submitLoanDetails`, `setCreditCheckScore`, `setRateQuote`, `submitBudgetAndStartCheck`, `eligibilitySucceeded` (payload includes full `EligibilityResponse`), `updateLoanAndRefreshResult`, `resetJourney`, etc.

- [ ] **Step 1: Rewrite journeySlice tests for new actions/payloads**

- [ ] **Step 2: Implement slice**

- [ ] **Step 3: Run journey tests — expect PASS**

---

### Task 9: Screen 1 — product, credit, Calculate

**Files:**

- Modify: `src/screens/loan-details-screen/LoanDetailsScreen.tsx`
- Modify: `src/screens/loan-details-screen/LoanDetailsScreen.test.tsx`
- Modify: `src/components/estimate-summary-card/*` — remove explore-rate slider; show API quote fields only when `rateQuote` exists
- Update e2e helpers as needed in later task

**Behaviour:**

1. Product `<Select>` from catalog products.
2. Amount/term/purpose from schema(product).
3. Optional credit score input.
4. Checkbox “Run a credit check” → on check true, call `runCreditCheck`, store score; on failure show error, uncheck or leave unchecked with message.
5. **Calculate** button → `calculateRate` with effective score optional → store `rateQuote` → show estimate.
6. **Continue** disabled until `rateQuote` matches current amount/term/loanType (invalidate quote when those inputs change).
7. No local `calculateRepayment` for the estimate card.

- [ ] **Step 1: Component tests** — Calculate calls service; Continue blocked without quote; credit-check opt-in calls service.

- [ ] **Step 2: Implement screen**

- [ ] **Step 3: Run screen tests — expect PASS**

---

### Task 10: Screen 2 — slim budget → eligibility

**Files:**

- Modify: `src/screens/your-budget-screen/YourBudgetScreen.tsx`
- Modify: `src/screens/your-budget-screen/YourBudgetScreen.test.tsx`
- Modify/delete: `src/utils/budgetDetailsSchema.ts` usage in favour of `buildBudgetSchema`
- Update `src/types/budget.ts` to API-aligned submitted budget

**Behaviour:**

- Fields: age, employmentStatus, employmentDuration, monthlyIncome, monthlyExpenses, existingDebt.
- Remove income source / business duration / credit fields / demo checkbox.
- Submit builds `EligibilityRequest` (include `loanDetails` + optional `financialInfo.creditScore` from journey) → `checkEligibility` → on ok store full response and go to results; on fail show message.

- [ ] **Step 1: Rewrite tests for slim form + eligibility payload**

- [ ] **Step 2: Implement**

- [ ] **Step 3: Run tests — expect PASS**

---

### Task 11: Screen 3 — results from eligibility + Adjust

**Files:**

- Modify: `src/screens/your-result-screen/YourResultScreen.tsx`
- Modify: `src/screens/your-result-screen/YourResultScreen.test.tsx`
- Modify/delete: `src/utils/deriveResultViewModel.ts` / `evaluateEligibility` usage — map view model from `EligibilityResponse` instead

**Behaviour:**

- Render `eligibilityResult`, `recommendedLoan`, `affordabilityAnalysis`.
- Adjust amount/term → `calculateRate` then `checkEligibility` with updated loan details; replace stored responses.
- Edit budget / Start again clear appropriately via journey actions.

- [ ] **Step 1: Tests for rendering API fields + Adjust calling both services**

- [ ] **Step 2: Implement**

- [ ] **Step 3: Run tests — expect PASS**

---

### Task 12: Remove dead local policy + fix unit suite

**Files:**

- Delete or gut: `src/utils/evaluateEligibility.ts`, `src/utils/policyThresholds.ts`, `src/utils/productSettings.ts` (keep currency helper elsewhere if needed — move `currencySymbol: 'R'` to `formatMoney.ts`), `src/utils/creditScoreRate.ts`, `src/utils/demoCreditScore.ts` if unused
- Update all imports/tests that referenced them
- Keep `calculateRepayment.ts` only if still used by MSW tests; otherwise move amortise solely under `src/mocks/logic/amortise.ts` and delete client repayment from screens

- [ ] **Step 1: `npm run typecheck` — fix all breakages**

- [ ] **Step 2: `npm run test` — fix or replace obsolete tests**

- [ ] **Step 3: `npm run lint`**

---

### Task 13: E2E + README

**Files:**

- Modify: `e2e/helpers/journey.ts`
- Modify: `e2e/journey.happy-path.spec.ts`
- Modify: `e2e/journey.eligibility-failure.spec.ts`
- Modify: `e2e/loan-details.spec.ts`
- Modify: `README.md`

**Behaviour:**

- Happy path: select product → fill loan → optional credit or credit-check → Calculate → Continue → budget → eligibility → see result copy from API.
- Failure: set `sessionStorage.mockApi.eligibilityFail = '1'` before check; assert error on budget screen.
- README: document five endpoints, optional creditScore, credit-check path, MSW-only mock, boot requires products + rules.

- [ ] **Step 1: Update helpers/selectors for new fields (product select, Calculate button)**

- [ ] **Step 2: Run `npm run build:e2e && npm run test:e2e`**

Expected: PASS

- [ ] **Step 3: Update README sections “Mock API” and “Current scope”**

---

## Self-review checklist (author)

| Requirement                                            | Task              |
| ------------------------------------------------------ | ----------------- |
| GET products                                           | 2, 5, 7, 9        |
| GET validation-rules → form rules                      | 2, 5, 6, 9, 10    |
| POST credit-check opt-in                               | 3, 5, 9           |
| Optional creditScore on calculate-rate                 | 3, 5, 9           |
| Optional creditScore improves eligibility              | 4, 10             |
| Screen 1 Calculate then Continue                       | 9                 |
| Screen 2 slim API fields                               | 10                |
| Screen 3 from eligibility; Adjust = rate + eligibility | 11                |
| Remove frontend policy ownership                       | 12                |
| E2E + README                                           | 13                |
| No Express                                             | Global + Task 2–4 |

No TBD placeholders. Types named in Task 1 are reused consistently later.
