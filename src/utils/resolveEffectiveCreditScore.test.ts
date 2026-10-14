import { describe, expect, it } from 'vitest';

import { resolveEffectiveCreditScore } from './resolveEffectiveCreditScore';

describe('resolveEffectiveCreditScore', () => {
  it('prefers entered credit score over credit-check score', () => {
    expect(resolveEffectiveCreditScore({ entered: 700, creditCheckScore: 620 })).toBe(700);
  });

  it('uses credit-check score when entered is null', () => {
    expect(resolveEffectiveCreditScore({ entered: null, creditCheckScore: 620 })).toBe(620);
  });

  it('returns undefined when neither score is present', () => {
    expect(resolveEffectiveCreditScore({ entered: null, creditCheckScore: null })).toBeUndefined();
  });
});
