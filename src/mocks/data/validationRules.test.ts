import { describe, expect, it } from 'vitest';

import type { LoanProduct } from '../../types/api';
import { formatMoney } from '../../utils/formatMoney';
import { MOCK_PRODUCTS } from './products';
import { createValidationRules, MOCK_VALIDATION_RULES } from './validationRules';

const fixtureProduct: LoanProduct = {
  id: 'fixture_loan',
  name: 'Fixture Loan',
  description: 'Test product for validation rule mapping',
  minAmount: 10000,
  maxAmount: 200000,
  minTerm: 9,
  maxTerm: 48,
  interestRateRange: { min: 11, max: 16 },
  purposes: ['other'],
};

describe('createValidationRules', () => {
  it('maps each product id to requestedAmount and loanTerm rules', () => {
    const rules = createValidationRules([fixtureProduct]);

    expect(Object.keys(rules)).toEqual(['fixture_loan']);
    expect(rules.fixture_loan).toEqual(
      expect.objectContaining({
        requestedAmount: expect.any(Object),
        loanTerm: expect.any(Object),
      }),
    );
  });

  it('uses product minAmount and maxAmount for requestedAmount bounds', () => {
    const rules = createValidationRules([fixtureProduct]);

    expect(rules.fixture_loan.requestedAmount.min).toBe(fixtureProduct.minAmount);
    expect(rules.fixture_loan.requestedAmount.max).toBe(fixtureProduct.maxAmount);
  });

  it('uses product minTerm and maxTerm for loanTerm bounds', () => {
    const rules = createValidationRules([fixtureProduct]);

    expect(rules.fixture_loan.loanTerm.min).toBe(fixtureProduct.minTerm);
    expect(rules.fixture_loan.loanTerm.max).toBe(fixtureProduct.maxTerm);
  });

  it('marks amount and term rules as required', () => {
    const rules = createValidationRules([fixtureProduct]);

    expect(rules.fixture_loan.requestedAmount.required).toBe(true);
    expect(rules.fixture_loan.loanTerm.required).toBe(true);
  });

  it('builds amount errorMessage from the product amount range via formatMoney', () => {
    const rules = createValidationRules([fixtureProduct]);

    expect(rules.fixture_loan.requestedAmount.errorMessage).toBe(
      `Loan amount must be between ${formatMoney(fixtureProduct.minAmount)} and ${formatMoney(fixtureProduct.maxAmount)}`,
    );
  });

  it('builds term errorMessage from the product term range', () => {
    const rules = createValidationRules([fixtureProduct]);

    expect(rules.fixture_loan.loanTerm.errorMessage).toBe(
      `Loan term must be between ${fixtureProduct.minTerm} and ${fixtureProduct.maxTerm} months`,
    );
  });

  it('returns an empty object when given an empty product list', () => {
    expect(createValidationRules([])).toEqual({});
  });

  it('keeps personal_loan and vehicle_loan entries distinct when using MOCK_PRODUCTS', () => {
    const rules = createValidationRules(MOCK_PRODUCTS);
    const personal = MOCK_PRODUCTS.find((product) => product.id === 'personal_loan');
    const vehicle = MOCK_PRODUCTS.find((product) => product.id === 'vehicle_loan');

    expect(personal).toBeDefined();
    expect(vehicle).toBeDefined();
    if (!personal || !vehicle) {
      return;
    }

    expect(Object.keys(rules)).toEqual(['personal_loan', 'vehicle_loan']);
    expect(rules.personal_loan.requestedAmount.min).toBe(personal.minAmount);
    expect(rules.personal_loan.requestedAmount.max).toBe(personal.maxAmount);
    expect(rules.personal_loan.loanTerm.min).toBe(personal.minTerm);
    expect(rules.personal_loan.loanTerm.max).toBe(personal.maxTerm);
    expect(rules.vehicle_loan.requestedAmount.min).toBe(vehicle.minAmount);
    expect(rules.vehicle_loan.requestedAmount.max).toBe(vehicle.maxAmount);
    expect(rules.vehicle_loan.loanTerm.min).toBe(vehicle.minTerm);
    expect(rules.vehicle_loan.loanTerm.max).toBe(vehicle.maxTerm);
  });

  it('wires MOCK_VALIDATION_RULES.loanDetails from createValidationRules(MOCK_PRODUCTS)', () => {
    expect(MOCK_VALIDATION_RULES.loanDetails).toEqual(createValidationRules(MOCK_PRODUCTS));
  });
});
