import { describe, expect, it } from 'vitest';

import { formatPercent } from './formatPercent';

describe('formatPercent', () => {
  it('formats whole percentages without trailing zeros', () => {
    expect(formatPercent(85)).toBe('85%');
    expect(formatPercent(20)).toBe('20%');
  });

  it('keeps meaningful fraction digits', () => {
    expect(formatPercent(12.5)).toBe('12.5%');
    expect(formatPercent(40.2)).toBe('40.2%');
  });

  it('preserves a valid zero value', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('retains values above 100 for display', () => {
    expect(formatPercent(120)).toBe('120%');
  });
});
