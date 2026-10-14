import type { LoanProduct, ProductsResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

const isLoanProduct = (value: unknown): value is LoanProduct => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const rateRange = candidate.interestRateRange;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.minAmount === 'number' &&
    typeof candidate.maxAmount === 'number' &&
    typeof candidate.minTerm === 'number' &&
    typeof candidate.maxTerm === 'number' &&
    Array.isArray(candidate.purposes) &&
    candidate.purposes.every((purpose) => typeof purpose === 'string') &&
    typeof rateRange === 'object' &&
    rateRange !== null &&
    typeof (rateRange as Record<string, unknown>).min === 'number' &&
    typeof (rateRange as Record<string, unknown>).max === 'number'
  );
};

const isProductsResponse = (value: unknown): value is ProductsResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.products) && candidate.products.every(isLoanProduct);
};

export type GetProductsResult =
  | { readonly ok: true; readonly products: readonly LoanProduct[] }
  | { readonly ok: false; readonly message: string };

export const getProducts = async (options?: {
  readonly signal?: AbortSignal;
}): Promise<GetProductsResult> => {
  try {
    const response = await fetch(loansApiPath('/products'), {
      method: 'GET',
      signal: options?.signal,
    });

    if (!response.ok) {
      return { ok: false, message: 'Unable to load loan products. Please try again.' };
    }

    const body = await readJsonBody(response);
    if (!isProductsResponse(body)) {
      return { ok: false, message: 'Loan products response was invalid.' };
    }

    return { ok: true, products: body.products };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: 'Unable to load loan products. Please try again.' };
  }
};
