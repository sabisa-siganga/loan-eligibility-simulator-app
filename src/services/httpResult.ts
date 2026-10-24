/**
 * Shared Result types and helpers for fetch adapters.
 *
 * Adapters return ServiceResult for expected request/parse failures and never
 * throw for those cases (AbortError is the intentional exception).
 */

/**
 * Successful service call carrying typed data.
 */
export type ServiceSuccess<T> = {
  readonly ok: true;
  readonly data: T;
};

/**
 * Failed service call with a user-facing message.
 */
export type ServiceFailure = {
  readonly ok: false;
  readonly message: string;
};

/**
 * Discriminated union used by all loan service adapters.
 */
export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

/**
 * Detect AbortError from DOMException or Error so cancelled fetches can rethrow.
 */
export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

/**
 * Safely parse a Response body as structured data.
 *
 * Empty or non-response body bodies become undefined so type guards can reject them.
 */
export const readJsonBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};
