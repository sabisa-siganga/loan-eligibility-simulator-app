import { MOCK_PRODUCTS } from '../data/products';

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export type PickRatePercentInput = {
  readonly loanType: string;
  readonly creditScore?: number;
};

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
