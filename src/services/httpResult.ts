/** Shared Result shape for fetch adapters — never throw for expected HTTP/parse failures. */
export type ServiceSuccess<T> = {
  readonly ok: true;
  readonly data: T;
};

export type ServiceFailure = {
  readonly ok: false;
  readonly message: string;
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

/** Safe JSON parse: empty/non-JSON bodies become `undefined` for type guards. */
export const readJsonBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};
