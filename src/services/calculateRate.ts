import type { CalculateRateRequest, CalculateRateResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

const isPaymentScheduleEntry = (value: unknown): boolean => {
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

const isCalculateRateResponse = (value: unknown): value is CalculateRateResponse => {
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

export type CalculateRateResult =
  | { readonly ok: true; readonly data: CalculateRateResponse }
  | { readonly ok: false; readonly message: string };

/** POST amortised repayment quote; validates the response shape before returning. */
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

    if (!response.ok) {
      return { ok: false, message: 'Unable to calculate repayment. Please try again.' };
    }

    const payload = await readJsonBody(response);
    if (!isCalculateRateResponse(payload)) {
      return { ok: false, message: 'Repayment calculation response was invalid.' };
    }

    return { ok: true, data: payload };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: 'Unable to calculate repayment. Please try again.' };
  }
};
