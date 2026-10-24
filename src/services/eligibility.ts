import type {
  EligibilityRequest,
  EligibilityResponse,
  RiskAssessmentStatus,
  RiskCategory,
} from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

/**
 * Allowed risk category values from the eligibility response.
 */
const RISK_CATEGORIES: readonly RiskCategory[] = ['low', 'medium', 'high'];

/**
 * Allowed risk assessment status values from the eligibility response.
 */
const RISK_ASSESSMENT_STATUSES: readonly RiskAssessmentStatus[] = [
  'assessed',
  'missing_credit_data',
  'credit_check_failed',
  'invalid_credit_response',
];

/**
 * Narrow an unknown value to a plain object record.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Narrow an unknown value to a known RiskCategory string.
 */
const isRiskCategory = (value: unknown): value is RiskCategory =>
  typeof value === 'string' && (RISK_CATEGORIES as readonly string[]).includes(value);

/**
 * Narrow an unknown value to a known RiskAssessmentStatus string.
 */
const isRiskAssessmentStatus = (value: unknown): value is RiskAssessmentStatus =>
  typeof value === 'string' && (RISK_ASSESSMENT_STATUSES as readonly string[]).includes(value);

/**
 * Narrow an unknown payload to EligibilityResponse.
 *
 * Checks eligibilityResult (including nullable likelihood/category),
 * recommendedLoan totals, and affordabilityAnalysis fields.
 */
const isEligibilityResponse = (value: unknown): value is EligibilityResponse => {
  /**
   * Top-level payload must be an object.
   */
  if (!isRecord(value)) {
    return false;
  }

  const eligibilityResult = value.eligibilityResult;
  const recommendedLoan = value.recommendedLoan;
  const affordabilityAnalysis = value.affordabilityAnalysis;

  /**
   * Nested sections must all be present as objects.
   */
  if (
    !isRecord(eligibilityResult) ||
    !isRecord(recommendedLoan) ||
    !isRecord(affordabilityAnalysis)
  ) {
    return false;
  }

  const { approvalLikelihood, riskCategory } = eligibilityResult;

  return (
    typeof eligibilityResult.isEligible === 'boolean' &&
    (approvalLikelihood === null || typeof approvalLikelihood === 'number') &&
    (riskCategory === null || isRiskCategory(riskCategory)) &&
    isRiskAssessmentStatus(eligibilityResult.riskAssessmentStatus) &&
    typeof eligibilityResult.decisionReason === 'string' &&
    typeof recommendedLoan.maxAmount === 'number' &&
    typeof recommendedLoan.recommendedAmount === 'number' &&
    typeof recommendedLoan.interestRate === 'number' &&
    typeof recommendedLoan.monthlyPayment === 'number' &&
    typeof recommendedLoan.totalRepayment === 'number' &&
    typeof affordabilityAnalysis.disposableIncome === 'number' &&
    typeof affordabilityAnalysis.debtToIncomeRatio === 'number' &&
    (affordabilityAnalysis.loanToIncomeRatio === null ||
      typeof affordabilityAnalysis.loanToIncomeRatio === 'number') &&
    typeof affordabilityAnalysis.affordabilityScore === 'string'
  );
};

/**
 * Discriminated result for eligibility: full response data or a user-facing message.
 */
export type CheckEligibilityResult =
  | { readonly ok: true; readonly data: EligibilityResponse }
  | { readonly ok: false; readonly message: string };

/**
 * POST eligibility and validate the response shape.
 *
 * Returns a discriminated result for expected failures; rethrows AbortError
 * so callers can ignore cancelled in-flight requests.
 */
export const checkEligibility = async (
  body: EligibilityRequest,
  options?: { readonly signal?: AbortSignal },
): Promise<CheckEligibilityResult> => {
  try {
    const response = await fetch(loansApiPath('/eligibility'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options?.signal,
    });

    /**
     * Non-OK response status → soft failure with a retry message.
     */
    if (!response.ok) {
      return {
        ok: false,
        message: 'Unable to check eligibility. Please try again.',
      };
    }

    const payload = await readJsonBody(response);

    /**
     * Reject payloads that do not match the expected eligibility shape.
     */
    if (!isEligibilityResponse(payload)) {
      return { ok: false, message: 'Eligibility response was invalid.' };
    }

    return { ok: true, data: payload };
  } catch (error) {
    /**
     * Propagate aborts; treat other network/parse errors as soft failures.
     */
    if (isAbortError(error)) {
      throw error;
    }
    return {
      ok: false,
      message: 'Unable to check eligibility. Please try again.',
    };
  }
};
