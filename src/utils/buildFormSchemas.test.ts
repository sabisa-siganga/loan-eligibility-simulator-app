import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../mocks/data/validationRules';
import { buildLoanDetailsSchema } from './buildFormSchemas';

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
