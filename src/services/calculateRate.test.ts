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

  it('returns failure when the HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    const result = await calculateRate({
      loanAmount: 150000,
      loanTerm: 24,
      loanType: 'personal_loan',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Unable to calculate repayment. Please try again.',
    });
  });

  it('returns failure when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await calculateRate({
      loanAmount: 150000,
      loanTerm: 24,
      loanType: 'personal_loan',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Unable to calculate repayment. Please try again.',
    });
  });

  it('rethrows AbortError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

    await expect(
      calculateRate({
        loanAmount: 150000,
        loanTerm: 24,
        loanType: 'personal_loan',
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
