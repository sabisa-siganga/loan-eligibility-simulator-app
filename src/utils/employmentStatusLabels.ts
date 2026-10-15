const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
};

const humanizeStatusId = (statusId: string): string =>
  statusId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getEmploymentStatusLabel = (statusId: string): string =>
  EMPLOYMENT_STATUS_LABELS[statusId] ?? humanizeStatusId(statusId);

/** Duration only applies when the applicant is (self-)employed. */
export const requiresEmploymentDuration = (status: string): boolean =>
  status === 'employed' || status === 'self_employed';
