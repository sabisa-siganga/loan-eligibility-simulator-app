import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOCK_VALIDATION_RULES } from '../mocks/data/validationRules';
import { getValidationRules } from './validationRules';

const validRulesBase = {
  personalInfo: MOCK_VALIDATION_RULES.personalInfo,
  financialInfo: MOCK_VALIDATION_RULES.financialInfo,
};

describe('getValidationRules', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns validation rules for a valid response', async () => {
    const result = await getValidationRules();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.financialInfo.creditScore.required).toBe(false);
      expect(result.rules.loanDetails.personal_loan?.requestedAmount.min).toBe(5000);
      expect(result.rules.loanDetails.vehicle_loan?.loanTerm.max).toBe(72);
    }
  });

  it('returns failure for a malformed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ personalInfo: {} }),
      }),
    );

    const result = await getValidationRules();
    expect(result).toEqual({
      ok: false,
      message: 'Validation rules response was invalid.',
    });
  });

  it('rejects a flat loanDetails shape that lacks product entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...validRulesBase,
          loanDetails: {
            requestedAmount: {
              min: 5000,
              max: 300000,
              required: true,
              errorMessage: 'Loan amount must be between R5 000 and R300 000',
            },
            loanTerm: {
              min: 6,
              max: 60,
              required: true,
              errorMessage: 'Loan term must be between 6 and 60 months',
            },
          },
        }),
      }),
    );

    const result = await getValidationRules();
    expect(result).toEqual({
      ok: false,
      message: 'Validation rules response was invalid.',
    });
  });

  it('rejects loanDetails when a product entry is missing loanTerm', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...validRulesBase,
          loanDetails: {
            personal_loan: {
              requestedAmount: {
                min: 5000,
                max: 300000,
                required: true,
                errorMessage: 'Loan amount must be between R5 000 and R300 000',
              },
            },
          },
        }),
      }),
    );

    const result = await getValidationRules();
    expect(result).toEqual({
      ok: false,
      message: 'Validation rules response was invalid.',
    });
  });

  it('returns failure when the response body is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      }),
    );

    const result = await getValidationRules();
    expect(result).toEqual({
      ok: false,
      message: 'Validation rules response was invalid.',
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

    const result = await getValidationRules();
    expect(result).toEqual({
      ok: false,
      message: 'Unable to load validation rules. Please try again.',
    });
  });

  it('returns failure when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await getValidationRules();
    expect(result).toEqual({
      ok: false,
      message: 'Unable to load validation rules. Please try again.',
    });
  });

  it('rethrows AbortError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

    await expect(getValidationRules()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
