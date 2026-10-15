import { describe, expect, it } from 'vitest';

import { getEmploymentStatusLabel, requiresEmploymentDuration } from './employmentStatusLabels';

describe('getEmploymentStatusLabel', () => {
  it('returns a readable label for known API employment statuses', () => {
    expect(getEmploymentStatusLabel('employed')).toBe('Employed');
    expect(getEmploymentStatusLabel('self_employed')).toBe('Self-employed');
  });

  it('humanizes unknown status ids', () => {
    expect(getEmploymentStatusLabel('contract_worker')).toBe('Contract Worker');
  });
});

describe('requiresEmploymentDuration', () => {
  it('is true only for employed and self_employed', () => {
    expect(requiresEmploymentDuration('employed')).toBe(true);
    expect(requiresEmploymentDuration('self_employed')).toBe(true);
    expect(requiresEmploymentDuration('unemployed')).toBe(false);
    expect(requiresEmploymentDuration('retired')).toBe(false);
    expect(requiresEmploymentDuration('')).toBe(false);
  });
});
