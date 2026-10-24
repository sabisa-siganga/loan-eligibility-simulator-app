import type {
  LoanProduct,
  LoanProductValidationRules,
  ValidationRulesResponse,
} from '../../types/api';
import { formatMoney } from '../../utils/formatMoney';
import { MOCK_PRODUCTS } from './products';

/**
 * Derives per-product amount/term bounds from the catalog so the mock
 * validation-rules endpoint stays aligned with product minimum/maximum values.
 */
export const createValidationRules = (
  products: readonly LoanProduct[],
): Record<string, LoanProductValidationRules> =>
  Object.fromEntries(
    products.map((product) => [
      product.id,
      {
        requestedAmount: {
          min: product.minAmount,
          max: product.maxAmount,
          required: true,
          errorMessage: `Loan amount must be between ${formatMoney(product.minAmount)} and ${formatMoney(product.maxAmount)}`,
        },
        loanTerm: {
          min: product.minTerm,
          max: product.maxTerm,
          required: true,
          errorMessage: `Loan term must be between ${product.minTerm} and ${product.maxTerm} months`,
        },
      },
    ]),
  );

/**
 * Full validation-rules payload for the mock endpoint.
 * Personal/financial bounds are fixed; loanDetails are derived from MOCK_PRODUCTS.
 */
export const MOCK_VALIDATION_RULES: ValidationRulesResponse = {
  /** Age, employment status, and minimum employment duration. */
  personalInfo: {
    age: {
      min: 18,
      max: 60,
      required: true,
      errorMessage: 'Age must be between 18 and 65',
    },
    employmentStatus: {
      required: true,
      options: ['employed', 'self_employed', 'unemployed', 'retired'],
      errorMessage: 'Please select your employment status',
    },
    employmentDuration: {
      min: 3,
      required: true,
      errorMessage: 'Minimum 3 months employment required',
    },
  },
  /** Income, expenses, and optional credit-score bounds. */
  financialInfo: {
    monthlyIncome: {
      min: 5000,
      required: true,
      errorMessage: 'Minimum monthly income of R5 000 required',
    },
    monthlyExpenses: {
      min: 0,
      required: true,
      errorMessage: 'Please enter your monthly expenses',
    },
    creditScore: {
      min: 300,
      max: 850,
      required: false,
      errorMessage: 'Credit score must be between 300 and 850',
    },
  },
  /** Per-product amount/term rules keyed by product identifier. */
  loanDetails: createValidationRules(MOCK_PRODUCTS),
};
