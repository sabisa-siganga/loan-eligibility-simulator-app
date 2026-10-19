const RISK_CATEGORY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const NOT_FULLY_ASSESSED_RISK_LABEL = 'Not fully assessed';

const humanizeCategoryId = (categoryId: string): string =>
  categoryId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const getRiskCategoryLabel = (categoryId: string | null): string => {
  if (categoryId === null) {
    return NOT_FULLY_ASSESSED_RISK_LABEL;
  }
  return RISK_CATEGORY_LABELS[categoryId.toLowerCase()] ?? humanizeCategoryId(categoryId);
};

export type RiskCategoryTone = 'low' | 'medium' | 'high' | 'unknown';

export const getRiskCategoryTone = (categoryId: string | null): RiskCategoryTone => {
  if (categoryId === null) {
    return 'unknown';
  }
  const normalised = categoryId.toLowerCase();
  if (normalised === 'low' || normalised === 'medium' || normalised === 'high') {
    return normalised;
  }
  return 'unknown';
};
