const AFFORDABILITY_RATING_LABELS: Record<string, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const humanizeRatingId = (ratingId: string): string =>
  ratingId
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

/** Formats API affordabilityScore strings for display (e.g. "good" → "Good"). */
export const getAffordabilityRatingLabel = (ratingId: string): string =>
  AFFORDABILITY_RATING_LABELS[ratingId.toLowerCase()] ?? humanizeRatingId(ratingId);

export type AffordabilityRatingTone = 'good' | 'fair' | 'poor' | 'neutral';

/** Maps API affordabilityScore ids to UI tone keys for StatusCircle styling. */
export const getAffordabilityRatingTone = (ratingId: string): AffordabilityRatingTone => {
  const normalised = ratingId.toLowerCase();
  if (normalised === 'good' || normalised === 'fair' || normalised === 'poor') {
    return normalised;
  }
  return 'neutral';
};
