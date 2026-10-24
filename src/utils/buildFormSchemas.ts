import { z } from 'zod';

import type {
  LoanProduct,
  LoanProductValidationRules,
  ValidationRulesResponse,
} from '../types/api';
import { requiresEmploymentDuration } from './employmentStatusLabels';
import { formatMoney } from './formatMoney';

/**
 * Zod schemas for journey forms, driven by the validation-rules endpoint payload.
 * Forms keep string field values; preprocess coerces empties/numbers before
 * bounds checks so React Hook Form + zodResolver see a consistent input type.
 */

/**
 * Raw string values held by the loan-details form before Zod parsing.
 */
export type LoanDetailsFormValues = {
  purpose: string;
  amount: string;
  termMonths: string;
};

/**
 * Parsed loan-details values after successful Zod coercion and validation.
 */
export type LoanDetailsFormParsedValues = {
  purpose: string;
  amount: number;
  termMonths: number;
};

/**
 * Treat blank optional fields as missing so Zod required/minimum checks can fire.
 *
 * Empty string, undefined, and null all become undefined; other values pass through.
 */
const emptyStringToUndefined = (value: unknown): unknown => {
  /**
   * Map empty/missing inputs to undefined for Zod's required semantics.
   */
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  return value;
};

/**
 * Coerce form strings to numbers when finite.
 *
 * Leave non-numeric strings intact so Zod can emit a typed number error
 * instead of a silent NaN. Blank values become undefined first.
 */
const toNumberOrUndefined = (value: unknown): unknown => {
  const normalized = emptyStringToUndefined(value);

  /**
   * Already blank — keep as undefined for required/minimum validation.
   */
  if (normalized === undefined) {
    return undefined;
  }

  /**
   * Numbers pass through unchanged (including non-finite for Zod to reject later).
   */
  if (typeof normalized === 'number') {
    return normalized;
  }

  /**
   * Parse numeric strings; keep the original string when parsing fails.
   */
  if (typeof normalized === 'string') {
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : normalized;
  }

  return normalized;
};

/**
 * Build amount/term rules from the catalog product when the validation-rules
 * endpoint has no entry for that product identifier.
 */
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

/**
 * Resolve per-product amount/term rules from the endpoint payload.
 *
 * Prefer the validation-rules entry for the product identifier; otherwise fall back
 * to catalog product bounds.
 */
const resolveProductLoanRules = (
  rules: ValidationRulesResponse,
  product: LoanProduct,
): LoanProductValidationRules => {
  const fromEndpoint = rules.loanDetails[product.id];
  return fromEndpoint ?? fallbackProductLoanRules(product);
};

/**
 * Read amount minimum/maximum for a product, falling back to catalog bounds when
 * the resolved rules omit a bound.
 */
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

/**
 * Read term minimum/maximum for a product, falling back to catalog bounds when
 * the resolved rules omit a bound.
 */
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

/**
 * Build the Zod schema for the loan-details step.
 *
 * Amount and term bounds come from the validation-rules endpoint per product
 * identifier, with catalog product bounds as fallback. Error messages prefer the endpoint
 * text when present.
 */
export const buildLoanDetailsSchema = ({
  rules,
  product,
}: {
  readonly rules: ValidationRulesResponse;
  readonly product: LoanProduct;
}) => {
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
    /**
     * Validate loan purpose.
     *
     * Blank values become undefined; accept only purposes listed on the product.
     */
    purpose: z.preprocess(
      (value) => {
        const normalized = emptyStringToUndefined(value);
        return normalized === undefined ? undefined : String(normalized);
      },
      z.enum(purposeValues, {
        message: 'Select a loan purpose to continue.',
      }),
    ),
    /**
     * Validate requested loan amount.
     *
     * Coerce the string to a number and require a finite value within
     * the product's minimum/maximum bounds.
     */
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
    /**
     * Validate repayment term in months.
     *
     * Coerce to a whole number and require a value within the product's
     * minimum/maximum term bounds.
     */
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

/**
 * Raw string values held by the budget/your-details form before Zod parsing.
 */
export type BudgetFormValues = {
  age: string;
  employmentStatus: string;
  employmentDuration: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  existingDebt: string;
};

/**
 * Parsed budget/your-details values after successful Zod coercion and validation.
 */
export type BudgetFormParsedValues = {
  age: number;
  employmentStatus: string;
  employmentDuration: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebt: number;
};

/**
 * Build the Zod schema for the budget/your-details step.
 *
 * Bounds and messages come from the validation-rules payload with sensible
 * defaults when a rule field is omitted. Employment duration is required only
 * for employed / self-employed statuses — see the preprocess + transform pair.
 */
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
  const existingDebtMessage = 'Enter a non-negative amount for existing monthly debt repayments';

  const employmentOptions = employmentRule.options ?? [];

  /**
   * Restrict employment status to endpoint options when present; otherwise require
   * any non-empty string.
   */
  const employmentEnum =
    employmentOptions.length > 0
      ? z.enum(employmentOptions as [string, ...string[]], { message: employmentMessage })
      : z.string().min(1, employmentMessage);

  const budgetObjectSchema = z
    .object({
      /**
       * Validate applicant age.
       *
       * Convert the entered value to a whole number and accept only ages
       * within the configured minimum/maximum (default 18–65).
       */
      age: z.preprocess(
        toNumberOrUndefined,
        z
          .number({ error: ageMessage })
          .int({ message: ageMessage })
          .min(ageMin, ageMessage)
          .max(ageMax, ageMessage),
      ),
      /**
       * Validate employment status.
       *
       * Blank values become undefined; accept only options from the rules
       * payload when options are provided.
       */
      employmentStatus: z.preprocess((value) => {
        const normalized = emptyStringToUndefined(value);
        return normalized === undefined ? undefined : String(normalized);
      }, employmentEnum),
      /**
       * Validate employment duration in months.
       *
       * Convert to a whole number and require at least the configured minimum
       * (default 3). Required only when status is employed / self-employed;
       * the outer preprocess and transform handle the other statuses.
       */
      employmentDuration: z.preprocess(
        toNumberOrUndefined,
        z
          .number({ error: durationMessage })
          .int({ message: durationMessage })
          .min(durationMin, durationMessage),
      ),
      /**
       * Validate monthly income.
       *
       * Coerce to a finite number and require at least the configured minimum
       * (default R5 000).
       */
      monthlyIncome: z.preprocess(
        toNumberOrUndefined,
        z.number({ error: incomeMessage }).finite().min(incomeMin, incomeMessage),
      ),
      /**
       * Validate monthly expenses.
       *
       * Coerce to a finite number and require at least the configured minimum
       * (default 0).
       */
      monthlyExpenses: z.preprocess(
        toNumberOrUndefined,
        z.number({ error: expensesMessage }).finite().min(expensesMin, expensesMessage),
      ),
      /**
       * Validate existing monthly debt repayments.
       *
       * Optional: blank means no existing debt (0). When filled, must be a
       * non-negative finite number.
       */
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
    /**
     * Zero out employment duration when the selected status does not require it.
     */
    .transform((data) => ({
      ...data,
      employmentDuration: requiresEmploymentDuration(data.employmentStatus)
        ? data.employmentDuration
        : 0,
    }));

  /**
   * When status does not require duration, inject a field-valid placeholder so
   * leftover or empty values cannot fail minimum/required checks; the transform
   * still coerces the output to 0.
   *
   * Cast preserves the inner schema's input type for zodResolver (preprocess
   * widens to unknown).
   */
  return z.preprocess((raw) => {
    /**
     * Non-object payloads pass through unchanged for Zod to reject.
     */
    if (raw === null || typeof raw !== 'object') {
      return raw;
    }

    const data = raw as Record<string, unknown>;
    const status = typeof data.employmentStatus === 'string' ? data.employmentStatus : '';

    /**
     * Statuses that require duration keep the raw duration value as entered.
     */
    if (requiresEmploymentDuration(status)) {
      return raw;
    }

    return { ...data, employmentDuration: String(durationMin) };
  }, budgetObjectSchema) as unknown as typeof budgetObjectSchema;
};
