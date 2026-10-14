import { describe, expect, it } from 'vitest';

import { resolveEffectiveCreditScore } from './resolveEffectiveCreditScore';

describe('resolveEffectiveCreditScore', () => {
  it('prefers entered credit score over credit-check score even when opted in', () => {
    expect(
      resolveEffectiveCreditScore({
        entered: 700,
        creditCheckScore: 620,
        creditCheckOptIn: true,
      }),
    ).toBe(700);
  });

  it('uses credit-check score when opted in and entered is null', () => {
    expect(
      resolveEffectiveCreditScore({
        entered: null,
        creditCheckScore: 620,
        creditCheckOptIn: true,
      }),
    ).toBe(620);
  });

  it('ignores stale credit-check score when opt-in is false', () => {
    expect(
      resolveEffectiveCreditScore({
        entered: null,
        creditCheckScore: 620,
        creditCheckOptIn: false,
      }),
    ).toBeUndefined();
  });

  it('returns undefined when opted in but no check score exists yet', () => {
    expect(
      resolveEffectiveCreditScore({
        entered: null,
        creditCheckScore: null,
        creditCheckOptIn: true,
      }),
    ).toBeUndefined();
  });

  it('returns undefined when neither score is present and opt-in is false', () => {
    expect(
      resolveEffectiveCreditScore({
        entered: null,
        creditCheckScore: null,
        creditCheckOptIn: false,
      }),
    ).toBeUndefined();
  });
});
