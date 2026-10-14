import { delay, http, HttpResponse } from 'msw';

const FIXED_SCORES = [620, 680, 720, 760] as const;
let creditCheckCount = 0;

export const resetCreditCheckCount = (): void => {
  creditCheckCount = 0;
};

export const creditCheckHandlers = [
  http.post('*/api/loans/credit-check', async () => {
    await delay(50);
    const creditScore = FIXED_SCORES[creditCheckCount % FIXED_SCORES.length];
    creditCheckCount += 1;
    return HttpResponse.json({ creditScore });
  }),
];
