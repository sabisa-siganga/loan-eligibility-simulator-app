import { describe, expect, it } from 'vitest';

import { isAbortError, readJsonBody } from './httpResult';

describe('httpResult helpers', () => {
  it('detects AbortError from DOMException and Error', () => {
    const namedAbort = new Error('Aborted');
    namedAbort.name = 'AbortError';

    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(namedAbort)).toBe(true);
    expect(isAbortError(new Error('boom'))).toBe(false);
  });

  it('returns undefined when JSON parsing fails', async () => {
    const response = {
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response;

    await expect(readJsonBody(response)).resolves.toBeUndefined();
  });
});
