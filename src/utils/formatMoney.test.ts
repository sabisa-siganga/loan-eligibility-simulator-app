import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatMoneyExact,
  formatMoneyInputDisplay,
  formatMoneyRange,
} from './formatMoney';

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

describe('formatMoneyInputDisplay', () => {
  it('formats digit strings with grouping and two decimals without currency', () => {
    expect(formatMoneyInputDisplay('30000')).toBe('30 000.00');
  });

  it('returns empty for blank or non-digit input', () => {
    expect(formatMoneyInputDisplay('')).toBe('');
    expect(formatMoneyInputDisplay('12a')).toBe('');
  });

  it('formats zero digits as 0.00', () => {
    expect(formatMoneyInputDisplay('0')).toBe('0.00');
  });
});
