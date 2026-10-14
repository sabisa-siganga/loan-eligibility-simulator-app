export const CURRENCY_SYMBOL = 'R';

export const formatMoney = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${CURRENCY_SYMBOL}${formatted}`;
};

export const formatMoneyRange = (min: number, max: number): string =>
  `${formatMoney(min)} to ${formatMoney(max)}`;
