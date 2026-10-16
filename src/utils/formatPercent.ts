/**
 * Formats a numeric percentage for display without unnecessary trailing zeros.
 * Examples: 20 → "20%", 12.5 → "12.5%", 85 → "85%"
 * Uses a period decimal marker for consistent presentation across locales.
 */
export const formatPercent = (value: number): string => {
  const rounded = Number(value.toFixed(2));
  const absolute = Math.abs(rounded);
  const [integerPart, fractionPart] = absolute.toString().split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = rounded < 0 ? '-' : '';
  const decimals = fractionPart ? `.${fractionPart}` : '';

  return `${sign}${groupedInteger}${decimals}%`;
};
