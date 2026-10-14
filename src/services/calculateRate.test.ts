import { afterEach, describe, expect, it, vi } from 'vitest';

import { calculateRate } from './calculateRate';

describe('calculateRate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a quote when creditScore is omitted', async () => {
    const result = await calculateRate({
      loanAmount: 150000,
      loanTerm: 24,
      loanType: 'personal_loan',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.monthlyPayment).toBeGreaterThan(0);
      expect(result.data.paymentSchedule).toHaveLength(24);
    }
  });

  it('returns failure for a malformed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ interestRate: 'nope' }),
      }),
    );

    const result = await calculateRate({
      loanAmount: 150000,
      loanTerm: 24,
      loanType: 'personal_loan',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Repayment calculation response was invalid.',
    });
  });
});
