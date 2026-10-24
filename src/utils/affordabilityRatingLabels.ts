/**
 * Known affordability score identifiers from the endpoint mapped to short display labels.
 */
const AFFORDABILITY_RATING_LABELS: Record<string, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

/**
 * Build a readable label for an unknown rating identifier.
 *
 * Split on underscores, spaces, or hyphens, capitalise each word,
 * and join with spaces so odd endpoint values still look presentable.
 */
const humanizeRatingId = (ratingId: string): string =>
  ratingId
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

/**
 * Format an endpoint affordabilityScore string for display.
 *
 * Prefer the known label map (case-insensitive); otherwise fall back
 * to a humanised version of the raw identifier (for example "very_good" → "Very Good").
 */
export const getAffordabilityRatingLabel = (ratingId: string): string =>
  AFFORDABILITY_RATING_LABELS[ratingId.toLowerCase()] ?? humanizeRatingId(ratingId);

/**
 * user interface tone keys used when styling affordability status indicators.
 */
export type AffordabilityRatingTone = 'good' | 'fair' | 'poor' | 'neutral';

/**
 * Map an endpoint affordabilityScore identifier to a user interface tone key.
 *
 * Known scores ("good", "fair", "poor") keep their own tone after
 * lowercasing; anything else becomes "neutral" so styling stays safe.
 */
export const getAffordabilityRatingTone = (ratingId: string): AffordabilityRatingTone => {
  const normalised = ratingId.toLowerCase();

  /**
   * Return the matching tone when the score is one of the three known values.
   */
  if (normalised === 'good' || normalised === 'fair' || normalised === 'poor') {
    return normalised;
  }

  return 'neutral';
};
