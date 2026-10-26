import { describe, expect, it } from 'vitest';

import { resetCreditCheckCount } from './creditCheck';

describe('catalog and rate handlers', () => {
  it('returns personal_loan and vehicle_loan from GET /api/loans/products', async () => {
    const response = await fetch('/api/loans/products');
    const body = (await response.json()) as {
      products: Array<{ id: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.products.map((product) => product.id)).toEqual(['personal_loan', 'vehicle_loan']);
  });

  it('returns validation rules including optional creditScore', async () => {
    const response = await fetch('/api/loans/validation-rules');
    const body = (await response.json()) as {
      financialInfo: { creditScore: { required: boolean } };
      loanDetails: {
        personal_loan: {
          requestedAmount: { min: number; max: number };
          loanTerm: { min: number; max: number };
        };
        vehicle_loan: {
          requestedAmount: { min: number; max: number };
          loanTerm: { min: number; max: number };
        };
      };
    };

    expect(response.status).toBe(200);
    expect(body.financialInfo.creditScore.required).toBe(false);
    expect(body.loanDetails.personal_loan.requestedAmount).toMatchObject({
      min: 5000,
      max: 300000,
    });
    expect(body.loanDetails.personal_loan.loanTerm).toMatchObject({
      min: 6,
      max: 60,
    });
    expect(body.loanDetails.vehicle_loan.requestedAmount).toMatchObject({
      min: 50000,
      max: 1500000,
    });
    expect(body.loanDetails.vehicle_loan.loanTerm).toMatchObject({
      min: 12,
      max: 72,
    });
  });

  it('returns fixed credit scores for each credit-check state', async () => {
    resetCreditCheckCount();

    const goodResponse = await fetch('/api/loans/credit-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'good' }),
    });
    const badResponse = await fetch('/api/loans/credit-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'bad' }),
    });
    const overLimitResponse = await fetch('/api/loans/credit-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'over_limit' }),
    });

    expect(goodResponse.status).toBe(200);
    expect(badResponse.status).toBe(200);
    expect(overLimitResponse.status).toBe(200);
    expect((await goodResponse.json()) as { creditScore: number }).toEqual({ creditScore: 520 });
    expect((await badResponse.json()) as { creditScore: number }).toEqual({ creditScore: 300 });
    expect((await overLimitResponse.json()) as { creditScore: number }).toEqual({
      creditScore: 900,
    });
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
