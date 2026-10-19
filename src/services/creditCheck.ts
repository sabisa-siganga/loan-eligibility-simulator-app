import type { CreditCheckResponse, CreditCheckState } from '../types/api';
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

/**
 * Simulated bureau check. `state` selects a fixed mock score (bad/good/over_limit);
 * omitted body defaults to the mock's "good" path.
 */
export const runCreditCheck = async (options?: {
  readonly signal?: AbortSignal;
  readonly state?: CreditCheckState;
}): Promise<RunCreditCheckResult> => {
  try {
    const response = await fetch(loansApiPath('/credit-check'), {
      method: 'POST',
      headers: options?.state ? { 'Content-Type': 'application/json' } : undefined,
      body: options?.state ? JSON.stringify({ state: options.state }) : undefined,
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
