export const getApiBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (typeof base === 'string' && base.length > 0) {
    return base.replace(/\/$/, '');
  }
  return '/api';
};

export const loansApiPath = (suffix: string): string =>
  `${getApiBaseUrl()}/loans${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
