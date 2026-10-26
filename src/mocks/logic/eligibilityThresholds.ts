import type { RiskCategory } from '../../types/api';
import { MOCK_VALIDATION_RULES } from '../data/validationRules';

/**
 * Shared eligibility / affordability / credit-risk thresholds for the mock
 * engine. These are simulator application rules, not a proprietary lending model.
 */

/** Debt-to-income affordability bands (percent). Living expenses are excluded from debt-to-income ratio. */
export const AFFORDABILITY_DTI_GOOD_MAX = 30;
export const AFFORDABILITY_DTI_FAIR_MAX = 45;

/** Credit-score bounds pulled from mock validation rules (fallback 300–850). */
const creditScoreRules = MOCK_VALIDATION_RULES.financialInfo.creditScore;
export const CREDIT_SCORE_MIN = creditScoreRules.min ?? 300;
export const CREDIT_SCORE_MAX = creditScoreRules.max ?? undefined;

/**
 * Credit-risk bands follow validation min/max:
 * ≤ min → high; above min and ≤ max → medium; above max is out of range (not assessed here).
 * There is no score-derived low credit-risk band.
 */

/** Affordability comfort labels derived from debt-to-income ratio bands. */
export type AffordabilityRating = 'good' | 'fair' | 'poor';

/**
 * Overall risk from credit risk × affordability.
 * Application rules for this simulator — not an underwriting model.
 */
const OVERALL_RISK_TABLE: Record<RiskCategory, Record<AffordabilityRating, RiskCategory>> = {
  low: { good: 'low', fair: 'medium', poor: 'high' },
  medium: { good: 'medium', fair: 'medium', poor: 'high' },
  high: { good: 'high', fair: 'high', poor: 'high' },
};

/**
 * Map a debt-to-income ratio percent to good / fair / poor.
 * ≤30 → good; ≤45 → fair; otherwise poor.
 */
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
 * ≤ CREDIT_SCORE_MIN → high; otherwise medium.
 */
export const creditRiskFromScore = (creditScore: number): RiskCategory => {
  if (creditScore <= CREDIT_SCORE_MIN) {
    return 'high';
  }
  return 'medium';
};

/**
 * Look up overall risk from the credit × affordability matrix.
 */
export const overallRiskFromCreditAndAffordability = (
  creditRisk: RiskCategory,
  affordability: AffordabilityRating,
): RiskCategory => OVERALL_RISK_TABLE[creditRisk][affordability];

/**
 * Credit-score-only mock approval estimate for in-bounds scores.
 * Callers must validate bounds first. Not a lender approval probability.
 * ≤ CREDIT_SCORE_MIN → 55; otherwise 70.
 */
export const simulatedApprovalEstimate = (creditScore: number): number => {
  if (creditScore <= CREDIT_SCORE_MIN) {
    return 55;
  }
  return 70;
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
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return fallback;
  }
  return (numerator / denominator) * 100;
};

/** Round currency-like values to two decimal places. */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/** Round ratio/percent values to two decimal places. */
export const roundRatio = (value: number): number => Math.round(value * 100) / 100;
