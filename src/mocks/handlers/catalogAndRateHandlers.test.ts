import { describe, expect, it } from 'vitest';

import { resetCreditCheckCount } from './creditCheck';

describe('catalog and rate handlers', () => {
  it('returns personal_loan and vehicle_loan from GET /api/loans/products', async () => {
    const response = await fetch('/api/loans/products');
    const body = (await response.json()) as {
      products: Array<{ id: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.products.map((product) => product.id)).toEqual([
      'personal_loan',
      'vehicle_loan',
    ]);
  });

  it('returns validation rules including optional creditScore', async () => {
    const response = await fetch('/api/loans/validation-rules');
    const body = (await response.json()) as {
      financialInfo: { creditScore: { required: boolean } };
    };

    expect(response.status).toBe(200);
    expect(body.financialInfo.creditScore.required).toBe(false);
  });

  it('returns a credit score in range from POST /api/loans/credit-check', async () => {
    resetCreditCheckCount();
    const response = await fetch('/api/loans/credit-check', { method: 'POST' });
    const body = (await response.json()) as { creditScore: number };

    expect(response.status).toBe(200);
    expect(body.creditScore).toBeGreaterThanOrEqual(300);
    expect(body.creditScore).toBeLessThanOrEqual(850);
  });

  it('calculates a rate without creditScore and improves rate when score is high', async () => {
    const withoutScoreResponse = await fetch('/api/loans/calculate-rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanAmount: 150000,
        loanTerm: 24,
        loanType: 'personal_loan',
      }),
    });
    const withoutScore = (await withoutScoreResponse.json()) as { interestRate: number };

    const withScoreResponse = await fetch('/api/loans/calculate-rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanAmount: 150000,
        loanTerm: 24,
        loanType: 'personal_loan',
        creditScore: 800,
      }),
    });
    const withScore = (await withScoreResponse.json()) as { interestRate: number };

    expect(withoutScoreResponse.status).toBe(200);
    expect(withScoreResponse.status).toBe(200);
    expect(withScore.interestRate).toBeLessThanOrEqual(withoutScore.interestRate);
  });
});
