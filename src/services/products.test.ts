import { afterEach, describe, expect, it, vi } from 'vitest';

import { getProducts } from './products';

describe('getProducts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns products for a valid response', async () => {
    const result = await getProducts();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.products.map((product) => product.id)).toEqual([
        'personal_loan',
        'vehicle_loan',
      ]);
    }
  });

  it('returns failure for a malformed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ products: [{ id: 1 }] }),
      }),
    );

    const result = await getProducts();
    expect(result).toEqual({
      ok: false,
      message: 'Loan products response was invalid.',
    });
  });
});
