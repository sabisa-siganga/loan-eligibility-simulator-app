import { delay, http, HttpResponse } from 'msw';

import type { CreditCheckState } from '../../types/api';

/** Allowed `state` values in the credit-check request body. */
const CREDIT_CHECK_STATES: readonly CreditCheckState[] = ['bad', 'good', 'over_limit'];

/**
 * Deterministic demo scores aligned with credit-risk bands (300–850 scale):
 * - bad (Poor credit): High risk (< 650)
 * - good (Good credit): Low risk (≥ 750)
 * - over_limit: above supported range → invalid credit response
 */
const FIXED_SCORES: Record<CreditCheckState, number> = {
  bad: 300,
  good: 520,
  over_limit: 900,
};

/** True when value is a non-null object (request body guard). */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** True when value is a known credit-check scenario identifier. */
const isCreditCheckState = (value: unknown): value is CreditCheckState =>
  typeof value === 'string' && (CREDIT_CHECK_STATES as readonly string[]).includes(value);

/**
 * Kept for test setup teardown compatibility; scoring no longer rotates by call count.
 * No-op by design.
 */
export const resetCreditCheckCount = (): void => {};

/**
 * Mock POST `/api/loans/credit-check`.
 * Empty body defaults to `good`; invalid body → 400; otherwise returns a fixed score.
 */
export const creditCheckHandlers = [
  http.post('*/api/loans/credit-check', async ({ request }) => {
    let body: unknown = null;

    /**
     * Read raw text so an empty body is allowed (defaults to good).
     * Non-empty but invalid request body → 400.
     */
    try {
      const text = await request.text();
      if (text.trim() !== '') {
        body = JSON.parse(text) as unknown;
      }
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    /** Default scenario when the client sends no body. */
    let state: CreditCheckState = 'good';
    if (body !== null) {
      /** Non-empty body must be `{ state: bad | good | over_limit }`. */
      if (!isRecord(body) || !isCreditCheckState(body.state)) {
        return HttpResponse.json(
          { message: 'Body must include state: bad | good | over_limit' },
          { status: 400 },
        );
      }
      state = body.state;
    }

    /** Short delay to mimic a network round-trip in the user interface. */
    await delay(50);
    /** Success: fixed score for the chosen scenario. */
    return HttpResponse.json({ creditScore: FIXED_SCORES[state] });
  }),
];
