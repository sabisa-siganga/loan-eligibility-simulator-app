import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EligibilityRequest } from '../types/api';
import { checkEligibility } from './eligibility';

const validRequest = (): EligibilityRequest => ({
  personalInfo: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
  financialInfo: {
    monthlyIncome: 25000,
    monthlyExpenses: 8000,
    existingDebt: 2000,
  },
  loanDetails: {
    requestedAmount: 150000,
    loanTerm: 24,
    loanPurpose: 'home_improvement',
  },
});

describe('checkEligibility', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns eligibility data for a valid request', async () => {
    const result = await checkEligibility(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.data.eligibilityResult.isEligible).toBe('boolean');
      expect(result.data.recommendedLoan.monthlyPayment).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns failure for a malformed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ eligibilityResult: 'nope' }),
      }),
    );

    const result = await checkEligibility(validRequest());

    expect(result).toEqual({
      ok: false,
      message: 'Eligibility response was invalid.',
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

    const result = await checkEligibility(validRequest());

    expect(result).toEqual({
      ok: false,
      message: 'Unable to check eligibility. Please try again.',
    });
  });

  it('rethrows AbortError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

    await expect(checkEligibility(validRequest())).rejects.toMatchObject({ name: 'AbortError' });
  });
});
