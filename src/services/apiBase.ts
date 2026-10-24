/**
 * Resolve the endpoint root from environment, defaulting to same-origin `/api` (Mock Service Worker in local/dev).
 *
 * Strips a trailing slash when a custom base address is set.
 */
export const getApiBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL;

  /**
   * Use the configured base when it is a non-empty string.
   */
  if (typeof base === 'string' && base.length > 0) {
    return base.replace(/\/$/, '');
  }

  return '/api';
};

/**
 * Build a full path under the loans endpoint namespace.
 *
 * Ensures the suffix always starts with a single leading slash.
 */
export const loansApiPath = (suffix: string): string =>
  `${getApiBaseUrl()}/loans${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
