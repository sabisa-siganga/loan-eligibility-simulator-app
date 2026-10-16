const RISK_CATEGORY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const humanizeCategoryId = (categoryId: string): string =>
  categoryId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const getRiskCategoryLabel = (categoryId: string): string =>
  RISK_CATEGORY_LABELS[categoryId.toLowerCase()] ?? humanizeCategoryId(categoryId);

export type RiskCategoryTone = 'low' | 'medium' | 'high' | 'unknown';

export const getRiskCategoryTone = (categoryId: string): RiskCategoryTone => {
  const normalised = categoryId.toLowerCase();
  if (normalised === 'low' || normalised === 'medium' || normalised === 'high') {
    return normalised;
  }
  return 'unknown';
};
