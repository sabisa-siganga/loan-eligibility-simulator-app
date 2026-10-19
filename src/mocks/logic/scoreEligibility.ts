import type {
  EligibilityRequest,
  EligibilityResponse,
  RiskAssessmentStatus,
  RiskCategory,
} from '../../types/api';
import { MOCK_PRODUCTS } from '../data/products';
import { MOCK_VALIDATION_RULES } from '../data/validationRules';
import { amortiseLoan, pickRatePercent, principalFromPayment } from './amortise';
import {
  type AffordabilityRating,
  affordabilityRatingFromDti,
  CREDIT_SCORE_MAX,
  CREDIT_SCORE_MIN,
  creditRiskFromScore,
  overallRiskFromCreditAndAffordability,
  roundMoney,
  roundRatio,
  safePercentRatio,
  simulatedApprovalEstimate,
} from './eligibilityThresholds';

/**
 * Mock eligibility engine used by MSW.
 *
 * Keeps three concerns separate:
 * - Eligibility: mandatory hard gates (unchanged).
 * - Affordability: DTI / remaining income comfort (Good / Fair / Poor).
 * - Overall risk: credit risk × affordability when a usable score exists.
 *
 * Hard gates (any failure → ineligible): age 18–65, monthly income ≥ R5,000,
 * employment duration ≥ 3 months when employed/self-employed, and remaining
 * income ≥ 0 after the estimated repayment. Out-of-range credit scores are an
 * assessment error (`invalid_credit_response`), not a normal eligibility
 * decline. Poor affordability or High overall risk alone does not decline.
 *
 * Simulated approval estimate (credit-score-only): below 650 → 55%, 650–749 → 70%,
 * 750+ → 95%. Null when missing, failed, invalid, or mandatory checks fail.
 *
 * Debt-to-income is debt repayments only (existing monthly debt + new payment)
 * over monthly income — living expenses are excluded from DTI but remain in
 * remaining income and the budget composition.
 *
 * maxAmount when eligible is the largest principal whose amortised payment
 * fits available income before the new repayment (income − expenses − existing
 * debt), capped by the catalog product max; declined → 0.
 */
const creditScoreOutOfBoundsMessage =
  MOCK_VALIDATION_RULES.financialInfo.creditScore.errorMessage ??
  'Credit score must be between 300 and 850';

const invalidCreditDecisionReason = `${creditScoreOutOfBoundsMessage}. Change the credit scenario or try again to complete your assessment.`;

/** Purpose strings live on products; fall back to the first catalog product. */
const resolveLoanType = (loanPurpose: string): string => {
  const match = MOCK_PRODUCTS.find((product) => product.purposes.includes(loanPurpose));
  return match?.id ?? MOCK_PRODUCTS[0]?.id ?? 'personal_loan';
};

const resolveProductMaxAmount = (loanType: string): number => {
  const product = MOCK_PRODUCTS.find((entry) => entry.id === loanType);
  return product?.maxAmount ?? 300000;
};

const emptyRecommendedLoan = (interestRate: number) => ({
  maxAmount: 0,
  recommendedAmount: 0,
  interestRate,
  monthlyPayment: 0,
  totalRepayment: 0,
});

type DecisionReasonInput = {
  readonly isEligible: boolean;
  readonly failureReasons: readonly string[];
  readonly creditRisk: RiskCategory | null;
  readonly affordabilityScore: AffordabilityRating;
  readonly riskAssessmentStatus: RiskAssessmentStatus;
  readonly overallRisk: RiskCategory | null;
};

/**
 * Build decisionReason from the actual assessment outcome.
 * Positive eligibility wording only when isEligible is true.
 */
export const buildDecisionReason = ({
  isEligible,
  failureReasons,
  creditRisk,
  affordabilityScore,
  riskAssessmentStatus,
  overallRisk,
}: DecisionReasonInput): string => {
  if (riskAssessmentStatus === 'invalid_credit_response') {
    return invalidCreditDecisionReason;
  }

  if (!isEligible) {
    return failureReasons.join('. ');
  }

  const parts: string[] = [];

  if (riskAssessmentStatus === 'missing_credit_data') {
    parts.push(
      'You meet the initial eligibility criteria. Overall risk has not been fully assessed because credit information is unavailable.',
    );
    if (affordabilityScore === 'poor') {
      parts.push('The proposed repayment leaves limited room in your budget.');
    } else if (affordabilityScore === 'fair') {
      parts.push('The proposed repayment may put pressure on your budget.');
    }
    return parts.join(' ');
  }

  if (riskAssessmentStatus === 'credit_check_failed') {
    parts.push(
      'You meet the initial eligibility criteria. Overall risk has not been fully assessed because the credit check failed.',
    );
    if (affordabilityScore === 'poor') {
      parts.push('The proposed repayment leaves limited room in your budget.');
    } else if (affordabilityScore === 'fair') {
      parts.push('The proposed repayment may put pressure on your budget.');
    }
    return parts.join(' ');
  }

  if (overallRisk === 'low' && affordabilityScore === 'good') {
    return 'Your credit profile and available monthly income support the proposed repayment.';
  }

  if (creditRisk === 'high') {
    parts.push(
      'Your credit profile increases repayment risk, even though you meet the initial eligibility criteria.',
    );
  }

  if (affordabilityScore === 'poor') {
    parts.push(
      parts.length === 0
        ? 'You meet the initial eligibility criteria, but the proposed repayment leaves limited room in your budget.'
        : 'The proposed repayment also leaves limited room in your budget.',
    );
  } else if (affordabilityScore === 'fair') {
    parts.push(
      parts.length === 0
        ? 'You meet the initial eligibility criteria, but the proposed repayment may put pressure on your budget.'
        : 'The proposed repayment may also put pressure on your budget.',
    );
  } else if (parts.length === 0) {
    parts.push(
      'You meet the initial eligibility criteria. Your available monthly income supports the proposed repayment.',
    );
  }

  return parts.join(' ');
};

export const scoreEligibility = (request: EligibilityRequest): EligibilityResponse => {
  const { age, employmentStatus, employmentDuration } = request.personalInfo;
  const { monthlyIncome, monthlyExpenses, existingDebt, creditScore, creditCheckFailed } =
    request.financialInfo;
  const { requestedAmount, loanTerm, loanPurpose } = request.loanDetails;

  const loanType = resolveLoanType(loanPurpose);
  const interestRate = pickRatePercent({ loanType, creditScore });
  const quote = amortiseLoan({
    principal: requestedAmount,
    termMonths: loanTerm,
    annualRatePercent: interestRate,
  });

  const hasScore = creditScore !== undefined;
  const scoreInBounds =
    hasScore && creditScore >= CREDIT_SCORE_MIN && creditScore <= CREDIT_SCORE_MAX;

  if (hasScore && !scoreInBounds) {
    return {
      eligibilityResult: {
        isEligible: false,
        approvalLikelihood: null,
        riskCategory: null,
        riskAssessmentStatus: 'invalid_credit_response',
        decisionReason: invalidCreditDecisionReason,
      },
      recommendedLoan: emptyRecommendedLoan(quote.interestRate),
      affordabilityAnalysis: {
        disposableIncome: 0,
        debtToIncomeRatio: 0,
        loanToIncomeRatio: null,
        affordabilityScore: 'poor',
      },
    };
  }

  const availableIncomeBeforeRepayment = monthlyIncome - monthlyExpenses - existingDebt;
  // Remaining monthly income after the estimated new repayment.
  const disposableIncome = roundMoney(availableIncomeBeforeRepayment - quote.monthlyPayment);

  const debtToIncomeRatio = roundRatio(
    safePercentRatio(existingDebt + quote.monthlyPayment, monthlyIncome),
  );

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

  const isEligible = failureReasons.length === 0;
  const recommendedAmount = isEligible ? requestedAmount : 0;
  // Retain the requested-loan repayment estimate for completed assessments.
  const monthlyPayment = quote.monthlyPayment;
  const totalRepayment = quote.totalRepayment;

  const loanToIncomeRatio =
    monthlyIncome > 0 ? roundRatio(safePercentRatio(requestedAmount, monthlyIncome * 12)) : null;

  const affordabilityScore = affordabilityRatingFromDti(debtToIncomeRatio);

  // Internal credit risk — only when a usable in-bounds score is present.
  let creditRisk: RiskCategory | null = null;
  let riskAssessmentStatus: RiskAssessmentStatus;

  if (scoreInBounds && creditScore !== undefined) {
    creditRisk = creditRiskFromScore(creditScore);
    riskAssessmentStatus = 'assessed';
  } else if (creditCheckFailed === true) {
    riskAssessmentStatus = 'credit_check_failed';
  } else {
    riskAssessmentStatus = 'missing_credit_data';
  }

  const overallRisk: RiskCategory | null =
    creditRisk !== null
      ? overallRiskFromCreditAndAffordability(creditRisk, affordabilityScore)
      : null;

  const approvalLikelihood =
    isEligible && scoreInBounds && creditScore !== undefined
      ? simulatedApprovalEstimate(creditScore)
      : null;

  const decisionReason = buildDecisionReason({
    isEligible,
    failureReasons,
    creditRisk,
    affordabilityScore,
    riskAssessmentStatus,
    overallRisk,
  });

  const maxMonthlyPayment = availableIncomeBeforeRepayment;
  const affordablePrincipal = principalFromPayment({
    monthlyPayment: maxMonthlyPayment,
    termMonths: loanTerm,
    annualRatePercent: interestRate,
  });
  const maxAmount = isEligible
    ? roundMoney(Math.min(affordablePrincipal, resolveProductMaxAmount(loanType)))
    : 0;

  return {
    eligibilityResult: {
      isEligible,
      approvalLikelihood,
      riskCategory: overallRisk,
      riskAssessmentStatus,
      decisionReason,
    },
    recommendedLoan: {
      maxAmount,
      recommendedAmount,
      interestRate: quote.interestRate,
      monthlyPayment,
      totalRepayment,
    },
    affordabilityAnalysis: {
      disposableIncome,
      debtToIncomeRatio,
      loanToIncomeRatio,
      affordabilityScore,
    },
  };
};
