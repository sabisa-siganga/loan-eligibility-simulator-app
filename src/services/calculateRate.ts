import type { CalculateRateRequest, CalculateRateResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

/**
 * Narrow an unknown value to a payment-schedule row shape.
 *
 * Requires month, payment, principal, interest, and balance as numbers.
 */
const isPaymentScheduleEntry = (value: unknown): boolean => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.month === 'number' &&
    typeof candidate.payment === 'number' &&
    typeof candidate.principal === 'number' &&
    typeof candidate.interest === 'number' &&
    typeof candidate.balance === 'number'
  );
};

/**
 * Narrow an unknown payload to CalculateRateResponse.
 *
 * Checks top-level totals and that every paymentSchedule entry is valid.
 */
const isCalculateRateResponse = (value: unknown): value is CalculateRateResponse => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.interestRate === 'number' &&
    typeof candidate.monthlyPayment === 'number' &&
    typeof candidate.totalInterest === 'number' &&
    typeof candidate.totalRepayment === 'number' &&
    Array.isArray(candidate.paymentSchedule) &&
    candidate.paymentSchedule.every(isPaymentScheduleEntry)
  );
};

/**
 * Discriminated result for calculate-rate: success data or a user-facing message.
 */
export type CalculateRateResult =
  | { readonly ok: true; readonly data: CalculateRateResponse }
  | { readonly ok: false; readonly message: string };

/**
 * POST an amortised repayment quote and validate the response shape.
 *
 * Returns ok:false for request or parse failures. Rethrows AbortError so callers
 * can ignore cancelled in-flight requests.
 */
export const calculateRate = async (
  body: CalculateRateRequest,
  options?: { readonly signal?: AbortSignal },
): Promise<CalculateRateResult> => {
  try {
    const response = await fetch(loansApiPath('/calculate-rate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options?.signal,
    });

    /**
     * Non-OK response status → soft failure with a retry message.
     */
    if (!response.ok) {
      return { ok: false, message: 'Unable to calculate repayment. Please try again.' };
    }

    const payload = await readJsonBody(response);

    /**
     * Reject payloads that do not match the expected quote shape.
     */
    if (!isCalculateRateResponse(payload)) {
      return { ok: false, message: 'Repayment calculation response was invalid.' };
    }

    return { ok: true, data: payload };
  } catch (error) {
    /**
     * Propagate aborts; treat other network/parse errors as soft failures.
     */
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: 'Unable to calculate repayment. Please try again.' };
  }
};
