import type { EligibilityRequest, EligibilityResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isEligibilityResponse = (value: unknown): value is EligibilityResponse => {
  if (!isRecord(value)) {
    return false;
  }

  const eligibilityResult = value.eligibilityResult;
  const recommendedLoan = value.recommendedLoan;
  const affordabilityAnalysis = value.affordabilityAnalysis;

  if (
    !isRecord(eligibilityResult) ||
    !isRecord(recommendedLoan) ||
    !isRecord(affordabilityAnalysis)
  ) {
    return false;
  }

  return (
    typeof eligibilityResult.isEligible === 'boolean' &&
    typeof eligibilityResult.approvalLikelihood === 'number' &&
    typeof eligibilityResult.riskCategory === 'string' &&
    typeof eligibilityResult.decisionReason === 'string' &&
    typeof recommendedLoan.maxAmount === 'number' &&
    typeof recommendedLoan.recommendedAmount === 'number' &&
    typeof recommendedLoan.interestRate === 'number' &&
    typeof recommendedLoan.monthlyPayment === 'number' &&
    typeof recommendedLoan.totalRepayment === 'number' &&
    typeof affordabilityAnalysis.disposableIncome === 'number' &&
    typeof affordabilityAnalysis.debtToIncomeRatio === 'number' &&
    typeof affordabilityAnalysis.loanToIncomeRatio === 'number' &&
    typeof affordabilityAnalysis.affordabilityScore === 'string'
  );
};

export type CheckEligibilityResult =
  | { readonly ok: true; readonly data: EligibilityResponse }
  | { readonly ok: false; readonly message: string };

/**
 * POST eligibility. Returns a discriminated result for expected failures;
 * rethrows AbortError so callers can ignore cancelled in-flight requests.
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

    if (!response.ok) {
      return {
        ok: false,
        message: 'Unable to check eligibility. Please try again.',
      };
    }

    const payload = await readJsonBody(response);
    if (!isEligibilityResponse(payload)) {
      return { ok: false, message: 'Eligibility response was invalid.' };
    }

    return { ok: true, data: payload };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return {
      ok: false,
      message: 'Unable to check eligibility. Please try again.',
    };
  }
};
