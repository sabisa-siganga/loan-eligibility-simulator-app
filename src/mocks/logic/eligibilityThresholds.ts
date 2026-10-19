import type { RiskCategory } from '../../types/api';
import { MOCK_VALIDATION_RULES } from '../data/validationRules';

/**
 * Shared eligibility / affordability / credit-risk thresholds for the mock
 * engine. These are simulator application rules, not a proprietary lending model.
 */

/** Debt-to-income affordability bands (percent). Living expenses are excluded from DTI. */
export const AFFORDABILITY_DTI_GOOD_MAX = 30;
export const AFFORDABILITY_DTI_FAIR_MAX = 45;

/**
 * Credit-risk score bands on the mock 300–850 scale.
 * Cutoffs reuse the prior likelihood heuristic bands already in this codebase.
 */
export const CREDIT_RISK_LOW_MIN = 750;
export const CREDIT_RISK_MEDIUM_MIN = 650;

const creditScoreRules = MOCK_VALIDATION_RULES.financialInfo.creditScore;
export const CREDIT_SCORE_MIN = creditScoreRules.min ?? 300;
export const CREDIT_SCORE_MAX = creditScoreRules.max ?? 850;

export type AffordabilityRating = 'good' | 'fair' | 'poor';

/**
 * Overall risk from credit risk × affordability.
 * Application rules for this simulator — not an underwriting model.
 */
const OVERALL_RISK_TABLE: Record<
  RiskCategory,
  Record<AffordabilityRating, RiskCategory>
> = {
  low: { good: 'low', fair: 'medium', poor: 'high' },
  medium: { good: 'medium', fair: 'medium', poor: 'high' },
  high: { good: 'high', fair: 'high', poor: 'high' },
};

export const affordabilityRatingFromDti = (debtToIncomeRatio: number): AffordabilityRating => {
  if (debtToIncomeRatio <= AFFORDABILITY_DTI_GOOD_MAX) {
    return 'good';
  }
  if (debtToIncomeRatio <= AFFORDABILITY_DTI_FAIR_MAX) {
    return 'fair';
  }
  return 'poor';
};

/**
 * Classify an in-bounds credit score. Callers must validate bounds first.
 */
export const creditRiskFromScore = (creditScore: number): RiskCategory => {
  if (creditScore >= CREDIT_RISK_LOW_MIN) {
    return 'low';
  }
  if (creditScore >= CREDIT_RISK_MEDIUM_MIN) {
    return 'medium';
  }
  return 'high';
};

export const overallRiskFromCreditAndAffordability = (
  creditRisk: RiskCategory,
  affordability: AffordabilityRating,
): RiskCategory => OVERALL_RISK_TABLE[creditRisk][affordability];

/**
 * Credit-score-only mock approval estimate for in-bounds scores.
 * Callers must validate 300–850 first. Not a lender approval probability.
 */
export const simulatedApprovalEstimate = (creditScore: number): number => {
  if (creditScore >= CREDIT_RISK_LOW_MIN) {
    return 95;
  }
  if (creditScore >= CREDIT_RISK_MEDIUM_MIN) {
    return 70;
  }
  return 55;
};

/**
 * Safe percent ratio. Non-finite inputs or non-positive denominator → fallback
 * (default 100) so callers never receive NaN or Infinity.
 */
export const safePercentRatio = (
  numerator: number,
  denominator: number,
  fallback = 100,
): number => {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return fallback;
  }
  return (numerator / denominator) * 100;
};

export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const roundRatio = (value: number): number => Math.round(value * 100) / 100;
