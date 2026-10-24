import type { CreditCheckResponse, CreditCheckState } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

/**
 * Narrow an unknown payload to CreditCheckResponse.
 *
 * Requires a finite numeric creditScore.
 */
const isCreditCheckResponse = (value: unknown): value is CreditCheckResponse => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.creditScore === 'number' && Number.isFinite(candidate.creditScore);
};

/**
 * Discriminated result for credit check: score on success, or a user-facing message.
 */
export type RunCreditCheckResult =
  | { readonly ok: true; readonly creditScore: number }
  | { readonly ok: false; readonly message: string };

/**
 * Run the simulated bureau credit check.
 *
 * `state` selects a fixed mock score (bad/good/over_limit). When omitted,
 * no body is sent and the mock defaults to its "good" path.
 * Returns ok:false for request or parse failures. Rethrows AbortError so callers
 * can ignore cancelled in-flight requests.
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

    /**
     * Non-OK response status → soft failure; user can retry or continue without a score.
     */
    if (!response.ok) {
      return {
        ok: false,
        message: 'Credit check failed. You can try again or continue without a score.',
      };
    }

    const body = await readJsonBody(response);

    /**
     * Reject payloads that do not include a finite creditScore.
     */
    if (!isCreditCheckResponse(body)) {
      return { ok: false, message: 'Credit check response was invalid.' };
    }

    return { ok: true, creditScore: body.creditScore };
  } catch (error) {
    /**
     * Propagate aborts; treat other network/parse errors as soft failures.
     */
    if (isAbortError(error)) {
      throw error;
    }
    return {
      ok: false,
      message: 'Credit check failed. You can try again or continue without a score.',
    };
  }
};
