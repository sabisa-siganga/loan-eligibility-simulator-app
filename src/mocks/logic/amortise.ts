import { MOCK_PRODUCTS } from '../data/products';

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export type PickRatePercentInput = {
  readonly loanType: string;
  readonly creditScore?: number;
};

/**
 * Maps credit score linearly onto the product's interest-rate band.
 * Higher score → closer to the band minimum; missing score → midpoint.
 */
export const pickRatePercent = ({ loanType, creditScore }: PickRatePercentInput): number => {
  const product = MOCK_PRODUCTS.find((entry) => entry.id === loanType);
  const min = product?.interestRateRange.min ?? 10.5;
  const max = product?.interestRateRange.max ?? 18.5;
  const mid = roundMoney((min + max) / 2);

  if (creditScore === undefined) {
    return mid;
  }

  const clampedScore = Math.min(850, Math.max(300, creditScore));
  const scoreRatio = (clampedScore - 300) / (850 - 300);
  return roundMoney(max - scoreRatio * (max - min));
};

export type AmortiseLoanInput = {
  readonly principal: number;
  readonly termMonths: number;
  readonly annualRatePercent: number;
};

/**
 * Standard amortising loan schedule (equal monthly payments).
 *
 * Uses the closed-form payment formula, then walks month-by-month so cents
 * rounding does not leave a residual balance — the final installment absorbs
 * whatever principal remains.
 */
export const amortiseLoan = ({ principal, termMonths, annualRatePercent }: AmortiseLoanInput) => {
  const monthlyRate = annualRatePercent / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths);

  const monthlyPayment = roundMoney(payment);
  let balance = principal;
  const paymentSchedule = Array.from({ length: termMonths }, (_, index) => {
    const interest = roundMoney(balance * monthlyRate);
    const isLast = index === termMonths - 1;
    // Last month: pay remaining principal exactly so schedule totals clear to 0.
    const principalPortion = isLast ? roundMoney(balance) : roundMoney(monthlyPayment - interest);
    const paymentAmount = isLast ? roundMoney(principalPortion + interest) : monthlyPayment;
    balance = roundMoney(Math.max(0, balance - principalPortion));

    return {
      month: index + 1,
      payment: paymentAmount,
      principal: principalPortion,
      interest,
      balance,
    };
  });

  const totalRepayment = roundMoney(paymentSchedule.reduce((sum, entry) => sum + entry.payment, 0));
  const totalInterest = roundMoney(totalRepayment - principal);

  return {
    interestRate: annualRatePercent,
    monthlyPayment,
    totalInterest,
    totalRepayment,
    paymentSchedule,
  };
};

export type PrincipalFromPaymentInput = {
  readonly monthlyPayment: number;
  readonly termMonths: number;
  readonly annualRatePercent: number;
};

/**
 * Inverse of the closed-form amortising payment: largest principal that fits
 * a given monthly payment at the given rate and term. Returns 0 when the
 * payment is non-positive or the term is invalid.
 */
export const principalFromPayment = ({
  monthlyPayment,
  termMonths,
  annualRatePercent,
}: PrincipalFromPaymentInput): number => {
  if (monthlyPayment <= 0 || termMonths <= 0) {
    return 0;
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) {
    return roundMoney(monthlyPayment * termMonths);
  }

  const principal =
    (monthlyPayment * (1 - (1 + monthlyRate) ** -termMonths)) / monthlyRate;
  return roundMoney(principal);
};
