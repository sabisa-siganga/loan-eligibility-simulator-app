export const CURRENCY_SYMBOL = 'R';

/**
 * Formats a rand amount with space thousands separators and a period decimal
 * marker so presentation stays consistent across environments (en-ZA ICU
 * variants may otherwise emit a decimal comma).
 */
const formatRandAmount = (amount: number, fractionDigits: number): string => {
  const absolute = Math.abs(amount);
  const [integerPart, fractionPart = ''] = absolute.toFixed(fractionDigits).split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = amount < 0 ? '-' : '';
  const decimals = fractionDigits > 0 ? `.${fractionPart}` : '';

  return `${sign}${CURRENCY_SYMBOL}${groupedInteger}${decimals}`;
};

export const formatMoney = (amount: number): string => formatRandAmount(amount, 0);

/** ZAR with two decimal places for repayment and exact money figures. */
export const formatMoneyExact = (amount: number): string => formatRandAmount(amount, 2);

export const formatMoneyRange = (min: number, max: number): string =>
  `${formatMoney(min)} to ${formatMoney(max)}`;

/**
 * Display-only money input value: space-grouped integer with two decimals,
 * without the currency symbol (the input addon already shows it).
 * Empty or non-digit strings return ''.
 */
export const formatMoneyInputDisplay = (digits: string): string => {
  if (digits.trim() === '') {
    return '';
  }

  if (!/^\d+$/.test(digits)) {
    return '';
  }

  const amount = Number(digits);
  if (!Number.isFinite(amount)) {
    return '';
  }

  return formatMoneyExact(amount).slice(CURRENCY_SYMBOL.length);
};
