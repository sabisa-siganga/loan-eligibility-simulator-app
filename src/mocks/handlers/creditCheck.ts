import { delay, http, HttpResponse } from 'msw';

import type { CreditCheckState } from '../../types/api';

const CREDIT_CHECK_STATES: readonly CreditCheckState[] = ['bad', 'good', 'over_limit'];

/** Scores stay inside validation-rules creditScore bounds (300–850). */
const FIXED_SCORES: Record<CreditCheckState, number> = {
  bad: 520,
  good: 720,
  over_limit: 820,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCreditCheckState = (value: unknown): value is CreditCheckState =>
  typeof value === 'string' && (CREDIT_CHECK_STATES as readonly string[]).includes(value);

/** Kept for test setup teardown compatibility; scoring no longer rotates by call count. */
export const resetCreditCheckCount = (): void => {};

export const creditCheckHandlers = [
  http.post('*/api/loans/credit-check', async ({ request }) => {
    let body: unknown = null;

    try {
      const text = await request.text();
      if (text.trim() !== '') {
        body = JSON.parse(text) as unknown;
      }
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    let state: CreditCheckState = 'good';
    if (body !== null) {
      if (!isRecord(body) || !isCreditCheckState(body.state)) {
        return HttpResponse.json(
          { message: 'Body must include state: bad | good | over_limit' },
          { status: 400 },
        );
      }
      state = body.state;
    }

    await delay(50);
    return HttpResponse.json({ creditScore: FIXED_SCORES[state] });
  }),
];
