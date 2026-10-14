import type { EligibilityRequest, EligibilityResponse } from '../../types/api';
import { MOCK_PRODUCTS } from '../data/products';
import { amortiseLoan, pickRatePercent } from './amortise';

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const resolveLoanType = (loanPurpose: string): string => {
  const match = MOCK_PRODUCTS.find((product) => product.purposes.includes(loanPurpose));
  return match?.id ?? MOCK_PRODUCTS[0]?.id ?? 'personal_loan';
};

const riskCategoryFromLikelihood = (approvalLikelihood: number): string => {
  if (approvalLikelihood >= 80) {
    return 'low';
  }
  if (approvalLikelihood >= 60) {
    return 'medium';
  }
  return 'high';
};

const affordabilityScoreFromRatio = (debtToIncomeRatio: number): string => {
  if (debtToIncomeRatio <= 30) {
    return 'good';
  }
  if (debtToIncomeRatio <= 45) {
    return 'fair';
  }
  return 'poor';
};

export const scoreEligibility = (request: EligibilityRequest): EligibilityResponse => {
  const { age, employmentStatus, employmentDuration } = request.personalInfo;
  const { monthlyIncome, monthlyExpenses, existingDebt, creditScore } = request.financialInfo;
  const { requestedAmount, loanTerm, loanPurpose } = request.loanDetails;

  const loanType = resolveLoanType(loanPurpose);
  const interestRate = pickRatePercent({ loanType, creditScore });
  const quote = amortiseLoan({
    principal: requestedAmount,
    termMonths: loanTerm,
    annualRatePercent: interestRate,
  });

  const disposableIncome = roundMoney(
    monthlyIncome - monthlyExpenses - existingDebt - quote.monthlyPayment,
  );
  const debtToIncomeRatio =
    monthlyIncome > 0
      ? roundMoney(((monthlyExpenses + existingDebt + quote.monthlyPayment) / monthlyIncome) * 100)
      : 100;
  const loanToIncomeRatio =
    monthlyIncome > 0 ? roundMoney((requestedAmount / (monthlyIncome * 12)) * 100) : 100;

  const failureReasons: string[] = [];

  if (age < 18 || age > 65) {
    failureReasons.push('Age must be between 18 and 65');
  }
  if (monthlyIncome < 5000) {
    failureReasons.push('Minimum monthly income of R5,000 required');
  }
  if (
    (employmentStatus === 'employed' || employmentStatus === 'self_employed') &&
    employmentDuration < 3
  ) {
    failureReasons.push('Minimum 3 months employment required');
  }
  if (disposableIncome < 0) {
    failureReasons.push('Disposable income is insufficient after estimated repayments');
  }

  let approvalLikelihood = 55;
  if (creditScore !== undefined) {
    if (creditScore >= 750) {
      approvalLikelihood += 25;
    } else if (creditScore >= 650) {
      approvalLikelihood += 15;
    } else {
      approvalLikelihood += 5;
    }
  }
  approvalLikelihood = Math.min(95, approvalLikelihood);

  const isEligible = failureReasons.length === 0;
  if (!isEligible) {
    approvalLikelihood = Math.min(approvalLikelihood, 40);
  }

  const riskCategory = riskCategoryFromLikelihood(approvalLikelihood);
  const decisionReason = isEligible
    ? 'Strong income-to-expense ratio and manageable existing debt'
    : failureReasons.join('. ');

  const maxAmount = isEligible
    ? roundMoney(Math.min(requestedAmount * 1.2, requestedAmount + 50000))
    : 0;
  const recommendedAmount = isEligible ? requestedAmount : 0;

  return {
    eligibilityResult: {
      isEligible,
      approvalLikelihood,
      riskCategory,
      decisionReason,
    },
    recommendedLoan: {
      maxAmount,
      recommendedAmount,
      interestRate: quote.interestRate,
      monthlyPayment: isEligible ? quote.monthlyPayment : 0,
      totalRepayment: isEligible ? quote.totalRepayment : 0,
    },
    affordabilityAnalysis: {
      disposableIncome,
      debtToIncomeRatio,
      loanToIncomeRatio,
      affordabilityScore: affordabilityScoreFromRatio(debtToIncomeRatio),
    },
  };
};
