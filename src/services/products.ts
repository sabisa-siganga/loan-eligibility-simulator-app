import type { LoanProduct, ProductsResponse } from '../types/api';
import { loansApiPath } from './apiBase';
import { isAbortError, readJsonBody } from './httpResult';

/**
 * Narrow an unknown value to LoanProduct.
 *
 * Checks identity fields, amount/term bounds, purposes array, and interest rate range.
 */
const isLoanProduct = (value: unknown): value is LoanProduct => {
  /**
   * Reject non-objects before reading properties.
   */
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

/**
 * Narrow an unknown payload to ProductsResponse.
 *
 * Requires a products array where every entry is a valid LoanProduct.
 */
const isProductsResponse = (value: unknown): value is ProductsResponse => {
  /**
   * Reject non-objects before reading properties.
   */
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.products) && candidate.products.every(isLoanProduct);
};

/**
 * Discriminated result for products: product list on success, or a user-facing message.
 */
export type GetProductsResult =
  | { readonly ok: true; readonly products: readonly LoanProduct[] }
  | { readonly ok: false; readonly message: string };

/**
 * GET the loan product catalog and validate the response shape.
 *
 * Returns ok:false for request or parse failures. Rethrows AbortError so callers
 * can ignore cancelled in-flight requests.
 */
export const getProducts = async (options?: {
  readonly signal?: AbortSignal;
}): Promise<GetProductsResult> => {
  try {
    const response = await fetch(loansApiPath('/products'), {
      method: 'GET',
      signal: options?.signal,
    });

    /**
     * Non-OK response status → soft failure with a retry message.
     */
    if (!response.ok) {
      return { ok: false, message: 'Unable to load loan products. Please try again.' };
    }

    const body = await readJsonBody(response);

    /**
     * Reject payloads that do not match the expected products shape.
     */
    if (!isProductsResponse(body)) {
      return { ok: false, message: 'Loan products response was invalid.' };
    }

    return { ok: true, products: body.products };
  } catch (error) {
    /**
     * Propagate aborts; treat other network/parse errors as soft failures.
     */
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: 'Unable to load loan products. Please try again.' };
  }
};
