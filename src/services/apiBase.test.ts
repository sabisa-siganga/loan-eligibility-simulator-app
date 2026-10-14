import { afterEach, describe, expect, it } from 'vitest';

import { getApiBaseUrl, loansApiPath } from './apiBase';

describe('getApiBaseUrl', () => {
  const original = import.meta.env.VITE_API_BASE_URL;

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = original;
  });

  it('strips a trailing slash from VITE_API_BASE_URL', () => {
    import.meta.env.VITE_API_BASE_URL = '/api/';
    expect(getApiBaseUrl()).toBe('/api');
  });

  it('defaults to /api when env is empty', () => {
    import.meta.env.VITE_API_BASE_URL = '';
    expect(getApiBaseUrl()).toBe('/api');
  });
});

describe('loansApiPath', () => {
  const original = import.meta.env.VITE_API_BASE_URL;

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = original;
  });

  it('joins a suffix that already starts with a slash', () => {
    import.meta.env.VITE_API_BASE_URL = '/api';
    expect(loansApiPath('/products')).toBe('/api/loans/products');
  });

  it('joins a suffix without a leading slash', () => {
    import.meta.env.VITE_API_BASE_URL = '/api';
    expect(loansApiPath('products')).toBe('/api/loans/products');
  });
});
