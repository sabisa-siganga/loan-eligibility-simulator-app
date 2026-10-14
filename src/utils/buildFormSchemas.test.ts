import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../mocks/data/validationRules';
import { buildBudgetSchema, buildLoanDetailsSchema } from './buildFormSchemas';

describe('buildLoanDetailsSchema', () => {
  const personalLoan = MOCK_PRODUCTS[0];
  const vehicleLoan = MOCK_PRODUCTS[1];

  it('rejects amount below the selected product minAmount even if validation-rules min is lower', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: vehicleLoan,
    });

    const result = schema.safeParse({
      purpose: 'new_vehicle',
      amount: 10000,
      termMonths: 24,
      creditScore: null,
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid personal loan submission and allows omitting creditScore', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    const result = schema.safeParse({
      purpose: 'home_improvement',
      amount: 150000,
      termMonths: 24,
      creditScore: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an out-of-range manual credit score', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    const result = schema.safeParse({
      purpose: 'education',
      amount: 20000,
      termMonths: 12,
      creditScore: 200,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a fractional term and an amount above the product max', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    expect(
      schema.safeParse({
        purpose: 'other',
        amount: 400000,
        termMonths: 12.5,
        creditScore: '',
      }).success,
    ).toBe(false);
  });

  it('accepts a credit score at the validation-rules boundary', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    expect(
      schema.safeParse({
        purpose: 'medical',
        amount: 5000,
        termMonths: 6,
        creditScore: 300,
      }).success,
    ).toBe(true);
  });

  it('falls back to default credit bounds when validation-rules omit them', () => {
    const rulesWithoutCreditBounds = {
      ...MOCK_VALIDATION_RULES,
      financialInfo: {
        ...MOCK_VALIDATION_RULES.financialInfo,
        creditScore: {
          required: false,
        },
      },
    };

    const schema = buildLoanDetailsSchema({
      rules: rulesWithoutCreditBounds,
      product: personalLoan,
    });

    expect(
      schema.safeParse({
        purpose: 'medical',
        amount: 5000,
        termMonths: 6,
        creditScore: 300,
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        purpose: 'medical',
        amount: 5000,
        termMonths: 6,
        creditScore: 200,
      }).success,
    ).toBe(false);
  });
});

describe('buildBudgetSchema', () => {
  const validBudget = {
    age: '35',
    employmentStatus: 'employed',
    employmentDuration: '24',
    monthlyIncome: '25000',
    monthlyExpenses: '8000',
    existingDebt: '0',
  };

  it('accepts a valid budget submission including zero existing debt', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });
    const result = schema.safeParse(validBudget);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.existingDebt).toBe(0);
      expect(result.data.age).toBe(35);
    }
  });

  it('rejects blank required fields while distinguishing blank from zero', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });

    expect(schema.safeParse({ ...validBudget, monthlyExpenses: '' }).success).toBe(false);
    expect(schema.safeParse({ ...validBudget, monthlyExpenses: '0' }).success).toBe(true);
    expect(schema.safeParse({ ...validBudget, existingDebt: '' }).success).toBe(false);
  });

  it('rejects age outside validation-rules bounds and unknown employment status', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });

    expect(schema.safeParse({ ...validBudget, age: '17' }).success).toBe(false);
    expect(schema.safeParse({ ...validBudget, employmentStatus: '' }).success).toBe(false);
    expect(schema.safeParse({ ...validBudget, employmentStatus: 'contractor' }).success).toBe(
      false,
    );
  });

  it('rejects employment duration below the validation-rules minimum', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });
    const result = schema.safeParse({ ...validBudget, employmentDuration: '2' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Minimum 3 months employment required');
    }
  });
});
