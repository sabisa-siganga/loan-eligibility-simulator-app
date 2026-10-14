import { afterEach, describe, expect, it, vi } from 'vitest';

import { getValidationRules } from './validationRules';

describe('getValidationRules', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns validation rules for a valid response', async () => {
    const result = await getValidationRules();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rules.financialInfo.creditScore.required).toBe(false);
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
});
