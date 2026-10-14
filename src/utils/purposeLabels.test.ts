import { GraduationCap, MoreHorizontal } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { getPurposeIcon, getPurposeLabel } from './purposeLabels';

describe('getPurposeLabel', () => {
  it('returns a readable label for known purpose ids', () => {
    expect(getPurposeLabel('home_improvement')).toBe('Home improvement');
  });

  it('humanizes unknown purpose ids', () => {
    expect(getPurposeLabel('solar_panels')).toBe('Solar Panels');
  });
});

describe('getPurposeIcon', () => {
  it('returns the mapped icon for a known purpose id', () => {
    expect(getPurposeIcon('education')).toBe(GraduationCap);
  });

  it('falls back to MoreHorizontal for an unknown purpose id', () => {
    expect(getPurposeIcon('unknown_purpose')).toBe(MoreHorizontal);
  });
});
