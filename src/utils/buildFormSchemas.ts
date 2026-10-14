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
  const amountMin = Math.max(rules.loanDetails.requestedAmount.min ?? product.minAmount, product.minAmount);
  const amountMax = Math.min(rules.loanDetails.requestedAmount.max ?? product.maxAmount, product.maxAmount);
  const termMin = Math.max(rules.loanDetails.loanTerm.min ?? product.minTerm, product.minTerm);
  const termMax = Math.min(rules.loanDetails.loanTerm.max ?? product.maxTerm, product.maxTerm);

  const amountMessage =
    `Loan amount must be between ${formatMoney(amountMin)} and ${formatMoney(amountMax)}`;
  const termMessage = `Loan term must be between ${termMin} and ${termMax} months`;
  const creditRule = rules.financialInfo.creditScore;
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
        .min(creditRule.min ?? 300, creditMessage)
        .max(creditRule.max ?? 850, creditMessage)
        .nullable()
        .optional(),
    ),
  });
};

export const getProductAmountBounds = (
  rules: ValidationRulesResponse,
  product: LoanProduct,
): { readonly min: number; readonly max: number } => ({
  min: Math.max(rules.loanDetails.requestedAmount.min ?? product.minAmount, product.minAmount),
  max: Math.min(rules.loanDetails.requestedAmount.max ?? product.maxAmount, product.maxAmount),
});

export const getProductTermBounds = (
  rules: ValidationRulesResponse,
  product: LoanProduct,
): { readonly min: number; readonly max: number } => ({
  min: Math.max(rules.loanDetails.loanTerm.min ?? product.minTerm, product.minTerm),
  max: Math.min(rules.loanDetails.loanTerm.max ?? product.maxTerm, product.maxTerm),
});
