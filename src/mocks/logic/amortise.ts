import { MOCK_PRODUCTS } from '../data/products';

/** Round to two decimal places (cents) using half-up via Math.round. */
const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/** Inputs for mapping a credit score onto a product interest-rate band. */
export type PickRatePercentInput = {
  readonly loanType: string;
  readonly creditScore?: number;
};

/**
 * Maps credit score linearly onto the product's interest-rate band.
 * Higher score → closer to the band minimum; missing score → midpoint.
 * Unknown product → default band 10.5–18.5. Score clamped to 300–850.
 */
export const pickRatePercent = ({ loanType, creditScore }: PickRatePercentInput): number => {
  const product = MOCK_PRODUCTS.find((entry) => entry.id === loanType);
  const min = product?.interestRateRange.min ?? 10.5;
  const max = product?.interestRateRange.max ?? 18.5;
  const mid = roundMoney((min + max) / 2);

  /** No credit score supplied → use the midpoint of the band. */
  if (creditScore === undefined) {
    return mid;
  }

  /** Clamp to the mock score scale, then interpolate maximum → minimum as score rises. */
  const clampedScore = Math.min(850, Math.max(300, creditScore));
  const scoreRatio = (clampedScore - 300) / (850 - 300);
  return roundMoney(max - scoreRatio * (max - min));
};

/** Inputs for building a full amortising schedule. */
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
 * whatever principal remains. Zero annual rate → equal principal splits.
 */
export const amortiseLoan = ({ principal, termMonths, annualRatePercent }: AmortiseLoanInput) => {
  const monthlyRate = annualRatePercent / 100 / 12;
  /**
   * Closed-form payment when rate > 0; otherwise divide principal evenly
   * across the term (interest-free).
   */
  const payment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths);

  const monthlyPayment = roundMoney(payment);
  let balance = principal;
  /**
   * Build each month: interest on remaining balance, principal = payment − interest
   * (last month pays remaining principal exactly so balance clears to 0).
   */
  const paymentSchedule = Array.from({ length: termMonths }, (_, index) => {
    const interest = roundMoney(balance * monthlyRate);
    const isLast = index === termMonths - 1;
    /**
     * Last month: pay remaining principal exactly so schedule totals clear to 0.
     * Earlier months: principal portion is payment minus interest.
     */
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

  /** Sum schedule payments for totals; interest is repayment minus principal. */
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

/** Inputs for the inverse amortisation: principal from a target monthly payment. */
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
  /** Invalid payment or term → no affordable principal. */
  if (monthlyPayment <= 0 || termMonths <= 0) {
    return 0;
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  /** Zero interest → principal is simply payment × months. */
  if (monthlyRate === 0) {
    return roundMoney(monthlyPayment * termMonths);
  }

  /** Rearranged amortisation formula for principal given payment, rate, term. */
  const principal = (monthlyPayment * (1 - (1 + monthlyRate) ** -termMonths)) / monthlyRate;
  return roundMoney(principal);
};
