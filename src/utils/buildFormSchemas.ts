import { z } from 'zod';

import type { LoanProduct, ValidationRulesResponse } from '../types/api';
import { formatMoney } from './formatMoney';

export type LoanDetailsFormValues = {
  purpose: string;
  amount: number | null;
  termMonths: number | null;
  creditScore: number | null;
};

const emptyToNullNumber = (value: unknown): unknown => {
  if (value === '' || value === undefined) {
    return null;
  }
  return value;
};

export const buildLoanDetailsSchema = ({
  rules,
  product,
}: {
  readonly rules: ValidationRulesResponse;
  readonly product: LoanProduct;
}) => {
  // Product bounds are the source of truth for amount/term so Vehicle Finance
  // is never constrained by Personal Loan validation-rules defaults.
  const amountMin = product.minAmount;
  const amountMax = product.maxAmount;
  const termMin = product.minTerm;
  const termMax = product.maxTerm;

  const amountMessage =
    `Loan amount must be between ${formatMoney(amountMin)} and ${formatMoney(amountMax)}`;
  const termMessage = `Loan term must be between ${termMin} and ${termMax} months`;
  const creditRule = rules.financialInfo.creditScore;
  const creditMin = creditRule.min ?? 300;
  const creditMax = creditRule.max ?? 850;
  const creditMessage =
    creditRule.errorMessage ?? 'Credit score must be between 300 and 850';

  const purposeValues = product.purposes as [string, ...string[]];

  return z.object({
    purpose: z.enum(purposeValues, {
      message: 'Select a loan purpose to continue.',
    }),
    amount: z.preprocess(
      emptyToNullNumber,
      z
        .number({
          error: 'Enter the required amount.',
        })
        .finite()
        .min(amountMin, amountMessage)
        .max(amountMax, amountMessage)
        .nullable()
        .refine((value) => value !== null, {
          message: 'Enter the required amount.',
        }),
    ),
    termMonths: z.preprocess(
      emptyToNullNumber,
      z
        .number({
          error: 'Enter the repayment term in months.',
        })
        .int({ message: 'Enter a whole number of months.' })
        .min(termMin, termMessage)
        .max(termMax, termMessage)
        .nullable()
        .refine((value) => value !== null, {
          message: 'Enter the repayment term in months.',
        }),
    ),
    creditScore: z.preprocess(
      emptyToNullNumber,
      z
        .number({
          error: creditMessage,
        })
        .int({ message: creditMessage })
        .min(creditMin, creditMessage)
        .max(creditMax, creditMessage)
        .nullable()
        .optional(),
    ),
  });
};

export const getProductAmountBounds = (
  _rules: ValidationRulesResponse,
  product: LoanProduct,
): { readonly min: number; readonly max: number } => ({
  min: product.minAmount,
  max: product.maxAmount,
});

export const getProductTermBounds = (
  _rules: ValidationRulesResponse,
  product: LoanProduct,
): { readonly min: number; readonly max: number } => ({
  min: product.minTerm,
  max: product.maxTerm,
});
