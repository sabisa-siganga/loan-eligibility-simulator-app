import { describe, expect, it } from 'vitest';

import { formatMoney, formatMoneyRange } from './formatMoney';

describe('formatMoney', () => {
  it('formats rand amounts without decimals', () => {
    expect(formatMoney(150000)).toBe('R150,000');
  });

  it('formats a money range', () => {
    expect(formatMoneyRange(5000, 300000)).toBe('R5,000 to R300,000');
  });
});
