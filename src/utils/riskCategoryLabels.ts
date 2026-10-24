/**
 * Known risk category identifiers from the endpoint mapped to short display labels.
 */
const RISK_CATEGORY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/**
 * Label shown when risk cannot be assessed (null category from the endpoint).
 */
export const NOT_FULLY_ASSESSED_RISK_LABEL = 'Not fully assessed';

/**
 * Build a readable label for an unknown risk category identifier.
 *
 * Split on underscores, capitalise each word, and join with spaces.
 */
const humanizeCategoryId = (categoryId: string): string =>
  categoryId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

/**
 * Format an endpoint risk category for display.
 *
 * Null means risk was not fully assessed. Otherwise prefer the known label
 * map (case-insensitive), or humanise the raw identifier as a fallback.
 */
export const getRiskCategoryLabel = (categoryId: string | null): string => {
  /**
   * Null category means overall risk could not be assessed.
   */
  if (categoryId === null) {
    return NOT_FULLY_ASSESSED_RISK_LABEL;
  }

  return RISK_CATEGORY_LABELS[categoryId.toLowerCase()] ?? humanizeCategoryId(categoryId);
};

/**
 * user interface tone keys used when styling risk category indicators.
 */
export type RiskCategoryTone = 'low' | 'medium' | 'high' | 'unknown';

/**
 * Map an endpoint risk category identifier to a user interface tone key.
 *
 * Null or unrecognised values become "unknown" so styling stays safe.
 */
export const getRiskCategoryTone = (categoryId: string | null): RiskCategoryTone => {
  /**
   * Null category has no tone — treat as unknown.
   */
  if (categoryId === null) {
    return 'unknown';
  }

  const normalised = categoryId.toLowerCase();

  /**
   * Return the matching tone when the category is one of the three known values.
   */
  if (normalised === 'low' || normalised === 'medium' || normalised === 'high') {
    return normalised;
  }

  return 'unknown';
};
