/**
 * Known employment status identifiers mapped to user-facing labels.
 */
const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
};

/**
 * Build a readable label for an unknown employment status identifier.
 *
 * Split on underscores, capitalise each word, and join with spaces.
 */
const humanizeStatusId = (statusId: string): string =>
  statusId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

/**
 * Resolve an employment status identifier to a display label.
 *
 * Prefer the known map; otherwise humanise the raw identifier so unexpected
 * endpoint values still render clearly.
 */
export const getEmploymentStatusLabel = (statusId: string): string =>
  EMPLOYMENT_STATUS_LABELS[statusId] ?? humanizeStatusId(statusId);

/**
 * Whether employment duration is required for this status.
 *
 * Duration only applies when the applicant is employed or self-employed.
 */
export const requiresEmploymentDuration = (status: string): boolean =>
  status === 'employed' || status === 'self_employed';
