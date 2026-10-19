import type { EligibilityRequest, EligibilityResponse } from '../../types/api';
import { MOCK_PRODUCTS } from '../data/products';
import { MOCK_VALIDATION_RULES } from '../data/validationRules';
import { amortiseLoan, pickRatePercent, principalFromPayment } from './amortise';

/**
 * Mock eligibility engine used by MSW.
 *
 * Flow: map purpose → product → interest rate → amortised repayment, then
 * derive affordability metrics and hard-fail gates.
 *
 * Hard gates (any failure → ineligible): credit score bounds (when provided),
 * age 18–65, monthly income ≥ R5,000, employment duration ≥ 3 months when
 * employed/self-employed, and disposable income ≥ 0 after the estimated
 * repayment. Poor affordability alone does not decline the application.
 *
 * Soft approvalLikelihood heuristic (not underwriting):
 * - Base 55 when no credit score is supplied.
 * - With a score: +25 if ≥ 750, +15 if ≥ 650, otherwise +5; capped at 95.
 * - Any hard fail forces likelihood ≤ 40 so the UI never shows high confidence
 *   alongside a decline.
 * Risk category is derived from likelihood: ≥ 80 low, ≥ 60 medium, else high.
 *
 * Debt-to-income is debt repayments only (existing monthly debt + new payment)
 * over monthly income — living expenses are excluded from DTI but remain in
 * disposable income and the budget composition.
 *
 * maxAmount when eligible is the largest principal whose amortised payment
 * fits remaining budget (income − expenses − existing debt), capped by the
 * catalog product max; declined → 0.
 */
const creditScoreRules = MOCK_VALIDATION_RULES.financialInfo.creditScore;
const creditScoreMin = creditScoreRules.min ?? 300;
const creditScoreMax = creditScoreRules.max ?? 850;
const creditScoreOutOfBoundsMessage =
  creditScoreRules.errorMessage ?? 'Credit score must be between 300 and 850';

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/** Purpose strings live on products; fall back to the first catalog product. */
const resolveLoanType = (loanPurpose: string): string => {
  const match = MOCK_PRODUCTS.find((product) => product.purposes.includes(loanPurpose));
  return match?.id ?? MOCK_PRODUCTS[0]?.id ?? 'personal_loan';
};

const resolveProductMaxAmount = (loanType: string): number => {
  const product = MOCK_PRODUCTS.find((entry) => entry.id === loanType);
  return product?.maxAmount ?? 300000;
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

/** DTI bands mirror typical affordability labels shown on the result screen. */
const affordabilityScoreFromRatio = (debtToIncomeRatio: number): string => {
  if (debtToIncomeRatio <= 30) {
    return 'good';
  }
  if (debtToIncomeRatio <= 45) {
    return 'fair';
  }
  return 'poor';
};

const decisionReasonFromAffordability = (affordabilityScore: string): string => {
  if (affordabilityScore === 'good') {
    return 'Strong income-to-expense ratio and manageable existing debt';
  }
  if (affordabilityScore === 'fair') {
    return 'You meet the eligibility checks with limited monthly headroom';
  }
  return 'You meet the minimum eligibility checks, but affordability is stretched with limited disposable income remaining';
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

  // Disposable income includes the estimated new repayment so affordability
  // reflects the full monthly burden, not just existing outgoings.
  const disposableIncome = roundMoney(
    monthlyIncome - monthlyExpenses - existingDebt - quote.monthlyPayment,
  );
  // DTI = debt service only (existing monthly debt repayments + new payment).
  const debtToIncomeRatio =
    monthlyIncome > 0
      ? roundMoney(((existingDebt + quote.monthlyPayment) / monthlyIncome) * 100)
      : 100;
  const loanToIncomeRatio =
    monthlyIncome > 0 ? roundMoney((requestedAmount / (monthlyIncome * 12)) * 100) : 100;

  const affordabilityScore = affordabilityScoreFromRatio(debtToIncomeRatio);

  const failureReasons: string[] = [];

  if (
    creditScore !== undefined &&
    (creditScore < creditScoreMin || creditScore > creditScoreMax)
  ) {
    failureReasons.push(creditScoreOutOfBoundsMessage);
  }
  if (age < 18 || age > 65) {
    failureReasons.push('Age must be between 18 and 65');
  }
  if (monthlyIncome < 5000) {
    failureReasons.push('Minimum monthly income of R5,000 required');
  }
  // Duration is only meaningful for employed / self-employed applicants.
  if (
    (employmentStatus === 'employed' || employmentStatus === 'self_employed') &&
    employmentDuration < 3
  ) {
    failureReasons.push('Minimum 3 months employment required');
  }
  if (disposableIncome < 0) {
    failureReasons.push('Disposable income is insufficient after estimated repayments');
  }

  // Soft score starts mid-pack and only climbs with stronger credit; declined
  // applications are forced ≤ 40 so the banner never contradicts the decision.
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
    ? decisionReasonFromAffordability(affordabilityScore)
    : failureReasons.join('. ');

  const maxMonthlyPayment = monthlyIncome - monthlyExpenses - existingDebt;
  const affordablePrincipal = principalFromPayment({
    monthlyPayment: maxMonthlyPayment,
    termMonths: loanTerm,
    annualRatePercent: interestRate,
  });
  const maxAmount = isEligible
    ? roundMoney(Math.min(affordablePrincipal, resolveProductMaxAmount(loanType)))
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
      affordabilityScore,
    },
  };
};
