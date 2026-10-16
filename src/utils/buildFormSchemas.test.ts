import { describe, expect, it } from 'vitest';

import type { ValidationRulesResponse } from '../types/api';
import { MOCK_PRODUCTS } from '../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../mocks/data/validationRules';
import {
  buildBudgetSchema,
  buildLoanDetailsSchema,
  getProductAmountBounds,
  getProductTermBounds,
} from './buildFormSchemas';

describe('buildLoanDetailsSchema', () => {
  const personalLoan = MOCK_PRODUCTS[0];
  const vehicleLoan = MOCK_PRODUCTS[1];

  const stricterPersonalRules: ValidationRulesResponse = {
    ...MOCK_VALIDATION_RULES,
    loanDetails: {
      ...MOCK_VALIDATION_RULES.loanDetails,
      personal_loan: {
        requestedAmount: {
          min: 5000,
          max: 100000,
          required: true,
          errorMessage: 'Loan amount must be between R5 000 and R100 000',
        },
        loanTerm: {
          min: 6,
          max: 36,
          required: true,
          errorMessage: 'Loan term must be between 6 and 36 months',
        },
      },
    },
  };

  it('rejects amounts outside the validation-rules bounds even when the product max is higher', () => {
    const schema = buildLoanDetailsSchema({
      rules: stricterPersonalRules,
      product: personalLoan,
    });

    const result = schema.safeParse({
      purpose: 'home_improvement',
      amount: '150000',
      termMonths: '24',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Loan amount must be between R5 000 and R100 000',
      );
    }
  });

  it('rejects terms outside the validation-rules bounds even when the product max is higher', () => {
    const schema = buildLoanDetailsSchema({
      rules: stricterPersonalRules,
      product: personalLoan,
    });

    const result = schema.safeParse({
      purpose: 'home_improvement',
      amount: '50000',
      termMonths: '48',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Loan term must be between 6 and 36 months');
    }
  });

  it('falls back to product catalog bounds when loanDetails has no entry for the product', () => {
    const rulesWithoutVehicle: ValidationRulesResponse = {
      ...MOCK_VALIDATION_RULES,
      loanDetails: {
        personal_loan: MOCK_VALIDATION_RULES.loanDetails.personal_loan,
      },
    };

    expect(getProductAmountBounds(rulesWithoutVehicle, vehicleLoan)).toEqual({
      min: vehicleLoan.minAmount,
      max: vehicleLoan.maxAmount,
    });
    expect(getProductTermBounds(rulesWithoutVehicle, vehicleLoan)).toEqual({
      min: vehicleLoan.minTerm,
      max: vehicleLoan.maxTerm,
    });

    const schema = buildLoanDetailsSchema({
      rules: rulesWithoutVehicle,
      product: vehicleLoan,
    });

    expect(
      schema.safeParse({
        purpose: 'new_vehicle',
        amount: '10000',
        termMonths: '24',
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        purpose: 'new_vehicle',
        amount: '80000',
        termMonths: '24',
      }).success,
    ).toBe(true);
  });

  it('accepts a valid personal loan submission from string drafts', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    const result = schema.safeParse({
      purpose: 'home_improvement',
      amount: '150000',
      termMonths: '24',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(150000);
      expect(result.data.termMonths).toBe(24);
    }
  });

  it('rejects blank purpose and blank amount', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    expect(
      schema.safeParse({
        purpose: '',
        amount: '20000',
        termMonths: '12',
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        purpose: 'education',
        amount: '',
        termMonths: '12',
      }).success,
    ).toBe(false);
  });

  it('rejects a fractional term and an amount above the validation-rules max', () => {
    const schema = buildLoanDetailsSchema({
      rules: MOCK_VALIDATION_RULES,
      product: personalLoan,
    });

    expect(
      schema.safeParse({
        purpose: 'other',
        amount: '400000',
        termMonths: '12.5',
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
  });

  it('treats blank existing debt as optional zero and rejects negative values', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });

    const blank = schema.safeParse({ ...validBudget, existingDebt: '' });
    expect(blank.success).toBe(true);
    if (blank.success) {
      expect(blank.data.existingDebt).toBe(0);
    }

    expect(schema.safeParse({ ...validBudget, existingDebt: '0' }).success).toBe(true);
    expect(schema.safeParse({ ...validBudget, existingDebt: '1500' }).success).toBe(true);
    expect(schema.safeParse({ ...validBudget, existingDebt: '-1' }).success).toBe(false);
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

  it('rejects employment duration below the minimum even when sibling fields are invalid', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });
    const result = schema.safeParse({
      age: '',
      employmentStatus: 'employed',
      employmentDuration: '2',
      monthlyIncome: '',
      monthlyExpenses: '',
      existingDebt: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path[0] === 'employmentDuration' &&
            issue.message === 'Minimum 3 months employment required',
        ),
      ).toBe(true);
    }
  });

  it('accepts unemployed and retired with empty employment duration as zero', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });

    for (const employmentStatus of ['unemployed', 'retired'] as const) {
      const result = schema.safeParse({
        ...validBudget,
        employmentStatus,
        employmentDuration: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.employmentDuration).toBe(0);
      }
    }
  });

  it('accepts unemployed and retired even when a leftover duration value is present', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });

    for (const employmentStatus of ['unemployed', 'retired'] as const) {
      const result = schema.safeParse({
        ...validBudget,
        employmentStatus,
        employmentDuration: '2',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.employmentDuration).toBe(0);
      }
    }
  });

  it('still requires employment duration when employed', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });
    const result = schema.safeParse({ ...validBudget, employmentDuration: '' });

    expect(result.success).toBe(false);
  });

  it('rejects empty employment duration for employed and self_employed even when siblings are invalid', () => {
    const schema = buildBudgetSchema({ rules: MOCK_VALIDATION_RULES });

    for (const employmentStatus of ['employed', 'self_employed'] as const) {
      const result = schema.safeParse({
        age: '',
        employmentStatus,
        employmentDuration: '',
        monthlyIncome: '',
        monthlyExpenses: '',
        existingDebt: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path[0] === 'employmentDuration' &&
              issue.message === 'Minimum 3 months employment required',
          ),
        ).toBe(true);
      }
    }
  });
});
