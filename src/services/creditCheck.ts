import type { CreditCheckResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

const isCreditCheckResponse = (value: unknown): value is CreditCheckResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.creditScore === 'number' && Number.isFinite(candidate.creditScore);
};

export type RunCreditCheckResult =
  | { readonly ok: true; readonly creditScore: number }
  | { readonly ok: false; readonly message: string };

export const runCreditCheck = async (options?: {
  readonly signal?: AbortSignal;
}): Promise<RunCreditCheckResult> => {
  try {
    const response = await fetch(loansApiPath('/credit-check'), {
      method: 'POST',
      signal: options?.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: 'Credit check failed. You can try again or continue without a score.',
      };
    }

    const body = await readJsonBody(response);
    if (!isCreditCheckResponse(body)) {
      return { ok: false, message: 'Credit check response was invalid.' };
    }

    return { ok: true, creditScore: body.creditScore };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return {
      ok: false,
      message: 'Credit check failed. You can try again or continue without a score.',
    };
  }
};
