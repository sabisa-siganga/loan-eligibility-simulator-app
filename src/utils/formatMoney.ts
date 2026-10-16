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
