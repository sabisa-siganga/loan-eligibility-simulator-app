import { describe, expect, it } from 'vitest';

import { getRiskCategoryLabel, getRiskCategoryTone } from './riskCategoryLabels';

describe('getRiskCategoryLabel', () => {
  it('formats documented risk categories', () => {
    expect(getRiskCategoryLabel('low')).toBe('Low');
    expect(getRiskCategoryLabel('medium')).toBe('Medium');
    expect(getRiskCategoryLabel('high')).toBe('High');
  });

  it('humanizes unknown category ids', () => {
    expect(getRiskCategoryLabel('very_high')).toBe('Very High');
  });
});

describe('getRiskCategoryTone', () => {
  it('maps known categories to semantic tones', () => {
    expect(getRiskCategoryTone('low')).toBe('low');
    expect(getRiskCategoryTone('MEDIUM')).toBe('medium');
    expect(getRiskCategoryTone('high')).toBe('high');
  });

  it('returns unknown for undocumented categories', () => {
    expect(getRiskCategoryTone('critical')).toBe('unknown');
  });
});
