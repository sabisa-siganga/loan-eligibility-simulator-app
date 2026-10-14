import { afterEach, describe, expect, it, vi } from 'vitest';

import { runCreditCheck } from './creditCheck';

describe('runCreditCheck', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a numeric credit score on success', async () => {
    const result = await runCreditCheck();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.creditScore).toBeGreaterThanOrEqual(300);
      expect(result.creditScore).toBeLessThanOrEqual(850);
    }
  });

  it('returns failure for a malformed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ creditScore: 'high' }),
      }),
    );

    const result = await runCreditCheck();
    expect(result).toEqual({
      ok: false,
      message: 'Credit check response was invalid.',
    });
  });

  it('returns failure when the response body is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      }),
    );

    const result = await runCreditCheck();
    expect(result).toEqual({
      ok: false,
      message: 'Credit check response was invalid.',
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

    const result = await runCreditCheck();
    expect(result).toEqual({
      ok: false,
      message: 'Credit check failed. You can try again or continue without a score.',
    });
  });

  it('returns failure when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await runCreditCheck();
    expect(result).toEqual({
      ok: false,
      message: 'Credit check failed. You can try again or continue without a score.',
    });
  });

  it('rethrows AbortError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

    await expect(runCreditCheck()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
