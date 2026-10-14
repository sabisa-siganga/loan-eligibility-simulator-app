import { describe, expect, it } from 'vitest';

import { getPurposeLabel } from './purposeLabels';

describe('getPurposeLabel', () => {
  it('returns a readable label for known purpose ids', () => {
    expect(getPurposeLabel('home_improvement')).toBe('Home improvement');
  });

  it('humanizes unknown purpose ids', () => {
    expect(getPurposeLabel('solar_panels')).toBe('Solar Panels');
  });
});
