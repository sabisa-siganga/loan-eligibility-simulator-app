import { z } from 'zod';

import type {
  LoanProduct,
  LoanProductValidationRules,
  ValidationRulesResponse,
} from '../types/api';
import { requiresEmploymentDuration } from './employmentStatusLabels';
import { formatMoney } from './formatMoney';

export type LoanDetailsFormValues = {
  purpose: string;
  amount: string;
  termMonths: string;
};

export type LoanDetailsFormParsedValues = {
  purpose: string;
  amount: number;
  termMonths: number;
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

const fallbackProductLoanRules = (product: LoanProduct): LoanProductValidationRules => ({
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
});

const resolveProductLoanRules = (
  rules: ValidationRulesResponse,
  product: LoanProduct,
): LoanProductValidationRules => {
  const fromEndpoint = rules.loanDetails[product.id];
  return fromEndpoint ?? fallbackProductLoanRules(product);
};

export const getProductAmountBounds = (
  rules: ValidationRulesResponse,
  product: LoanProduct,
): { readonly min: number; readonly max: number } => {
  const productRules = resolveProductLoanRules(rules, product);
  return {
    min: productRules.requestedAmount.min ?? product.minAmount,
    max: productRules.requestedAmount.max ?? product.maxAmount,
  };
};

export const getProductTermBounds = (
  rules: ValidationRulesResponse,
  product: LoanProduct,
): { readonly min: number; readonly max: number } => {
  const productRules = resolveProductLoanRules(rules, product);
  return {
    min: productRules.loanTerm.min ?? product.minTerm,
    max: productRules.loanTerm.max ?? product.maxTerm,
  };
};

export const buildLoanDetailsSchema = ({
  rules,
  product,
}: {
  readonly rules: ValidationRulesResponse;
  readonly product: LoanProduct;
}) => {
  // Validation-rules endpoint owns amount/term bounds per product id.
  // Fall back to catalog product bounds only when that product entry is missing.
  const productRules = resolveProductLoanRules(rules, product);
  const amountBounds = getProductAmountBounds(rules, product);
  const termBounds = getProductTermBounds(rules, product);

  const amountMessage =
    productRules.requestedAmount.errorMessage ??
    `Loan amount must be between ${formatMoney(amountBounds.min)} and ${formatMoney(amountBounds.max)}`;
  const termMessage =
    productRules.loanTerm.errorMessage ??
    `Loan term must be between ${termBounds.min} and ${termBounds.max} months`;
  const purposeValues = product.purposes as [string, ...string[]];

  return z.object({
    purpose: z.preprocess(
      (value) => {
        const normalized = emptyStringToUndefined(value);
        return normalized === undefined ? undefined : String(normalized);
      },
      z.enum(purposeValues, {
        message: 'Select a loan purpose to continue.',
      }),
    ),
    amount: z.preprocess(
      toNumberOrUndefined,
      z
        .number({
          error: 'Enter the required amount.',
        })
        .finite()
        .min(amountBounds.min, amountMessage)
        .max(amountBounds.max, amountMessage),
    ),
    termMonths: z.preprocess(
      toNumberOrUndefined,
      z
        .number({
          error: 'Enter the repayment term in months.',
        })
        .int({ message: 'Enter a whole number of months.' })
        .min(termBounds.min, termMessage)
        .max(termBounds.max, termMessage),
    ),
  });
};
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
  const durationMessage =
    durationRule.errorMessage ?? `Minimum ${durationMin} months employment required`;
  const incomeMin = incomeRule.min ?? 5000;
  const incomeMessage = incomeRule.errorMessage ?? 'Minimum monthly income of R5 000 required';
  const expensesMin = expensesRule.min ?? 0;
  const expensesMessage = expensesRule.errorMessage ?? 'Please enter your monthly expenses';
  const existingDebtMessage = 'Enter a non-negative amount for existing debt';

  const employmentOptions = employmentRule.options ?? [];
  const employmentEnum =
    employmentOptions.length > 0
      ? z.enum(employmentOptions as [string, ...string[]], { message: employmentMessage })
      : z.string().min(1, employmentMessage);

  const budgetObjectSchema = z
    .object({
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
      // Optional: blank means no existing debt (0). When filled, must be a non-negative number.
      existingDebt: z.preprocess(
        toNumberOrUndefined,
        z
          .number({ error: existingDebtMessage })
          .finite()
          .min(0, existingDebtMessage)
          .optional()
          .default(0),
      ),
    })
    .transform((data) => ({
      ...data,
      employmentDuration: requiresEmploymentDuration(data.employmentStatus)
        ? data.employmentDuration
        : 0,
    }));

  // When status does not require duration, inject a field-valid placeholder so leftover
  // or empty values cannot fail min/required checks; transform still coerces to 0.
  // Cast preserves the inner schema's input type for zodResolver (preprocess widens to unknown).
  return z.preprocess((raw) => {
    if (raw === null || typeof raw !== 'object') {
      return raw;
    }
    const data = raw as Record<string, unknown>;
    const status = typeof data.employmentStatus === 'string' ? data.employmentStatus : '';
    if (requiresEmploymentDuration(status)) {
      return raw;
    }
    return { ...data, employmentDuration: String(durationMin) };
  }, budgetObjectSchema) as unknown as typeof budgetObjectSchema;
};
