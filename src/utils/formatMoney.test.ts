import { describe, expect, it } from 'vitest';

import { formatMoney, formatMoneyExact, formatMoneyRange } from './formatMoney';

describe('formatMoney', () => {
  it('formats rand amounts without decimals', () => {
    expect(formatMoney(150000)).toBe('R150 000');
  });

  it('formats a money range', () => {
    expect(formatMoneyRange(5000, 300000)).toBe('R5 000 to R300 000');
  });
});

describe('formatMoneyExact', () => {
  it('formats repayment amounts with two decimal places', () => {
    expect(formatMoneyExact(7089.5)).toBe('R7 089.50');
  });

  it('formats whole amounts with trailing zeros', () => {
    expect(formatMoneyExact(150000)).toBe('R150 000.00');
  });

  it('preserves a valid zero value', () => {
    expect(formatMoneyExact(0)).toBe('R0.00');
  });
});
