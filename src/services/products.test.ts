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

  it('returns failure when the HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    const result = await getProducts();
    expect(result).toEqual({
      ok: false,
      message: 'Unable to load loan products. Please try again.',
    });
  });

  it('returns failure when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await getProducts();
    expect(result).toEqual({
      ok: false,
      message: 'Unable to load loan products. Please try again.',
    });
  });

  it('rethrows AbortError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

    await expect(getProducts()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
