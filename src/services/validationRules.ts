import type { ValidationRulesResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

/**
 * Narrow an unknown value to a FieldRule-shaped object.
 *
 * minimum/maximum, required, errorMessage, and options are all optional but must
 * have the correct type when present.
 */
const isFieldRule = (value: unknown): boolean => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const optionalNumber = (key: string) =>
    candidate[key] === undefined || typeof candidate[key] === 'number';
  const optionalBoolean = (key: string) =>
    candidate[key] === undefined || typeof candidate[key] === 'boolean';
  const optionalString = (key: string) =>
    candidate[key] === undefined || typeof candidate[key] === 'string';
  const optionalOptions =
    candidate.options === undefined ||
    (Array.isArray(candidate.options) &&
      candidate.options.every((option) => typeof option === 'string'));

  return (
    optionalNumber('min') &&
    optionalNumber('max') &&
    optionalBoolean('required') &&
    optionalString('errorMessage') &&
    optionalOptions
  );
};

/**
 * Narrow an unknown value to per-product amount/term validation rules.
 */
const isLoanProductValidationRules = (value: unknown): boolean => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return isFieldRule(candidate.requestedAmount) && isFieldRule(candidate.loanTerm);
};

/**
 * Narrow loanDetails to a non-empty map of product identifier → amount/term rules.
 */
const isProductKeyedLoanDetails = (value: unknown): boolean => {
  /**
   * Reject non-objects before reading entries.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entries = Object.entries(value as Record<string, unknown>);

  /**
   * At least one product entry is required.
   */
  if (entries.length === 0) {
    return false;
  }

  return entries.every(([, productRules]) => isLoanProductValidationRules(productRules));
};

/**
 * Narrow an unknown payload to ValidationRulesResponse.
 *
 * Checks personalInfo, financialInfo field rules, and product-keyed loanDetails.
 */
const isValidationRulesResponse = (value: unknown): value is ValidationRulesResponse => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const personalInfo = candidate.personalInfo;
  const financialInfo = candidate.financialInfo;
  const loanDetails = candidate.loanDetails;

  /**
   * Nested sections must all be present as objects.
   */
  if (
    typeof personalInfo !== 'object' ||
    personalInfo === null ||
    typeof financialInfo !== 'object' ||
    financialInfo === null ||
    typeof loanDetails !== 'object' ||
    loanDetails === null
  ) {
    return false;
  }

  const personal = personalInfo as Record<string, unknown>;
  const financial = financialInfo as Record<string, unknown>;

  return (
    isFieldRule(personal.age) &&
    isFieldRule(personal.employmentStatus) &&
    isFieldRule(personal.employmentDuration) &&
    isFieldRule(financial.monthlyIncome) &&
    isFieldRule(financial.monthlyExpenses) &&
    isFieldRule(financial.creditScore) &&
    isProductKeyedLoanDetails(loanDetails)
  );
};

/**
 * Discriminated result for validation rules: rules on success, or a user-facing message.
 */
export type GetValidationRulesResult =
  | { readonly ok: true; readonly rules: ValidationRulesResponse }
  | { readonly ok: false; readonly message: string };

/**
 * GET form validation rules and validate the response shape.
 *
 * Returns ok:false for request or parse failures. Rethrows AbortError so callers
 * can ignore cancelled in-flight requests.
 */
export const getValidationRules = async (options?: {
  readonly signal?: AbortSignal;
}): Promise<GetValidationRulesResult> => {
  try {
    const response = await fetch(loansApiPath('/validation-rules'), {
      method: 'GET',
      signal: options?.signal,
    });

    /**
     * Non-OK response status → soft failure with a retry message.
     */
    if (!response.ok) {
      return { ok: false, message: 'Unable to load validation rules. Please try again.' };
    }

    const body = await readJsonBody(response);

    /**
     * Reject payloads that do not match the expected rules shape.
     */
    if (!isValidationRulesResponse(body)) {
      return { ok: false, message: 'Validation rules response was invalid.' };
    }

    return { ok: true, rules: body };
  } catch (error) {
    /**
     * Propagate aborts; treat other network/parse errors as soft failures.
     */
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: 'Unable to load validation rules. Please try again.' };
  }
};
