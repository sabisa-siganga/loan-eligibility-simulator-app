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

  const amountMessage = `Loan amount must be between ${formatMoney(amountMin)} and ${formatMoney(amountMax)}`;
  const termMessage = `Loan term must be between ${termMin} and ${termMax} months`;
  const creditRule = rules.financialInfo.creditScore;
  const creditMin = creditRule.min ?? 300;
  const creditMax = creditRule.max ?? 850;
  const creditMessage = creditRule.errorMessage ?? 'Credit score must be between 300 and 850';

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

export type BudgetFormValues = {
  age: string;
  employmentStatus: string;
  employmentDuration: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  existingDebt: string;
};

export type BudgetFormParsedValues = {
  age: number;
  employmentStatus: string;
  employmentDuration: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebt: number;
};

const emptyStringToUndefined = (value: unknown): unknown => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  return value;
};

const toNumberOrUndefined = (value: unknown): unknown => {
  const normalized = emptyStringToUndefined(value);
  if (normalized === undefined) {
    return undefined;
  }
  if (typeof normalized === 'number') {
    return normalized;
  }
  if (typeof normalized === 'string') {
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : normalized;
  }
  return normalized;
};

export const buildBudgetSchema = ({ rules }: { readonly rules: ValidationRulesResponse }) => {
  const ageRule = rules.personalInfo.age;
  const employmentRule = rules.personalInfo.employmentStatus;
  const durationRule = rules.personalInfo.employmentDuration;
  const incomeRule = rules.financialInfo.monthlyIncome;
  const expensesRule = rules.financialInfo.monthlyExpenses;

  const ageMin = ageRule.min ?? 18;
  const ageMax = ageRule.max ?? 65;
  const ageMessage = ageRule.errorMessage ?? `Age must be between ${ageMin} and ${ageMax}`;
  const employmentMessage = employmentRule.errorMessage ?? 'Please select your employment status';
  const durationMin = durationRule.min ?? 3;
  const durationMessage = durationRule.errorMessage ?? `Minimum ${durationMin} months employment required`;
  const incomeMin = incomeRule.min ?? 5000;
  const incomeMessage = incomeRule.errorMessage ?? 'Minimum monthly income of R5 000 required';
  const expensesMin = expensesRule.min ?? 0;
  const expensesMessage = expensesRule.errorMessage ?? 'Please enter your monthly expenses';
  const existingDebtMessage = 'Please enter your existing debt';

  const employmentOptions = employmentRule.options ?? [];
  const employmentEnum =
    employmentOptions.length > 0
      ? z.enum(employmentOptions as [string, ...string[]], { message: employmentMessage })
      : z.string().min(1, employmentMessage);

  return z.object({
    age: z.preprocess(
      toNumberOrUndefined,
      z
        .number({ error: ageMessage })
        .int({ message: ageMessage })
        .min(ageMin, ageMessage)
        .max(ageMax, ageMessage),
    ),
    employmentStatus: z.preprocess((value) => {
      const normalized = emptyStringToUndefined(value);
      return normalized === undefined ? undefined : String(normalized);
    }, employmentEnum),
    employmentDuration: z.preprocess(
      toNumberOrUndefined,
      z
        .number({ error: durationMessage })
        .int({ message: durationMessage })
        .min(durationMin, durationMessage),
    ),
    monthlyIncome: z.preprocess(
      toNumberOrUndefined,
      z.number({ error: incomeMessage }).finite().min(incomeMin, incomeMessage),
    ),
    monthlyExpenses: z.preprocess(
      toNumberOrUndefined,
      z.number({ error: expensesMessage }).finite().min(expensesMin, expensesMessage),
    ),
    existingDebt: z.preprocess(
      toNumberOrUndefined,
      z.number({ error: existingDebtMessage }).finite().min(0, existingDebtMessage),
    ),
  });
};
