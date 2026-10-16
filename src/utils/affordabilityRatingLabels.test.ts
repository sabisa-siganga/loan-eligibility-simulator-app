import { describe, expect, it } from 'vitest';

import {
  getAffordabilityRatingLabel,
  getAffordabilityRatingTone,
} from './affordabilityRatingLabels';

describe('getAffordabilityRatingLabel', () => {
  it('formats documented affordability ratings', () => {
    expect(getAffordabilityRatingLabel('good')).toBe('Good');
    expect(getAffordabilityRatingLabel('fair')).toBe('Fair');
    expect(getAffordabilityRatingLabel('poor')).toBe('Poor');
  });

  it('humanizes unknown rating ids', () => {
    expect(getAffordabilityRatingLabel('very_good')).toBe('Very Good');
  });
});

describe('getAffordabilityRatingTone', () => {
  it('maps documented affordability ratings to tone keys', () => {
    expect(getAffordabilityRatingTone('good')).toBe('good');
    expect(getAffordabilityRatingTone('fair')).toBe('fair');
    expect(getAffordabilityRatingTone('poor')).toBe('poor');
  });

  it('normalises casing before mapping', () => {
    expect(getAffordabilityRatingTone('Good')).toBe('good');
    expect(getAffordabilityRatingTone('FAIR')).toBe('fair');
  });

  it('returns neutral for unknown rating ids', () => {
    expect(getAffordabilityRatingTone('very_good')).toBe('neutral');
  });
});
