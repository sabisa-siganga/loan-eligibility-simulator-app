import type { ValidationRulesResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

const isFieldRule = (value: unknown): boolean => {
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

const isValidationRulesResponse = (value: unknown): value is ValidationRulesResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const personalInfo = candidate.personalInfo;
  const financialInfo = candidate.financialInfo;
  const loanDetails = candidate.loanDetails;

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
  const loan = loanDetails as Record<string, unknown>;

  return (
    isFieldRule(personal.age) &&
    isFieldRule(personal.employmentStatus) &&
    isFieldRule(personal.employmentDuration) &&
    isFieldRule(financial.monthlyIncome) &&
    isFieldRule(financial.monthlyExpenses) &&
    isFieldRule(financial.creditScore) &&
    isFieldRule(loan.requestedAmount) &&
    isFieldRule(loan.loanTerm)
  );
};

export type GetValidationRulesResult =
  | { readonly ok: true; readonly rules: ValidationRulesResponse }
  | { readonly ok: false; readonly message: string };

export const getValidationRules = async (options?: {
  readonly signal?: AbortSignal;
}): Promise<GetValidationRulesResult> => {
  try {
    const response = await fetch(loansApiPath('/validation-rules'), {
      method: 'GET',
      signal: options?.signal,
    });

    if (!response.ok) {
      return { ok: false, message: 'Unable to load validation rules. Please try again.' };
    }

    const body = await readJsonBody(response);
    if (!isValidationRulesResponse(body)) {
      return { ok: false, message: 'Validation rules response was invalid.' };
    }

    return { ok: true, rules: body };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: 'Unable to load validation rules. Please try again.' };
  }
};
