import { describe, expect, it } from 'vitest';

import { getEmploymentStatusLabel } from './employmentStatusLabels';

describe('getEmploymentStatusLabel', () => {
  it('returns a readable label for known API employment statuses', () => {
    expect(getEmploymentStatusLabel('employed')).toBe('Employed');
    expect(getEmploymentStatusLabel('self_employed')).toBe('Self-employed');
  });

  it('humanizes unknown status ids', () => {
    expect(getEmploymentStatusLabel('contract_worker')).toBe('Contract Worker');
  });
});
