import { CircleDollarSign, Wallet } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { getProductIcon } from './productIcons';

describe('getProductIcon', () => {
  it('returns the mapped icon for a known product id', () => {
    expect(getProductIcon('personal_loan')).toBe(Wallet);
  });

  it('falls back to CircleDollarSign for an unknown product id', () => {
    expect(getProductIcon('unknown_product')).toBe(CircleDollarSign);
  });
});
