export const CURRENCY_SYMBOL = 'R';

export const formatMoney = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[\u00a0\u202f]/g, ' ');

  return `${CURRENCY_SYMBOL}${formatted}`;
};

export const formatMoneyRange = (min: number, max: number): string =>
  `${formatMoney(min)} to ${formatMoney(max)}`;
