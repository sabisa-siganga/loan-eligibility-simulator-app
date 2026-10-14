import { describe, expect, it } from 'vitest';

import {
  INITIAL_JOURNEY_SCREEN,
  journeyReducer,
  resetJourney,
  selectPrimaryActionMode,
  selectPurpose,
  selectRateQuoteMatchesCurrentInputs,
  setCreditCheckScore,
  setCurrentScreen,
  setEligibilityResult,
  setLoanAmount,
  setLoanTerm,
  setManualCreditScore,
  setPersonalDetails,
  setRateQuote,
} from './journeySlice';

const sampleQuote = {
  interestRate: 12.5,
  monthlyPayment: 100,
  totalInterest: 200,
  totalRepayment: 2400,
  paymentSchedule: [],
};

describe('journeySlice', () => {
  it('starts on the loan details screen', () => {
    const state = journeyReducer(undefined, { type: 'unknown' });
    expect(state.currentScreen).toBe(INITIAL_JOURNEY_SCREEN);
  });

  it('updates the current screen', () => {
    const state = journeyReducer(undefined, setCurrentScreen('yourBudget'));
    expect(state.currentScreen).toBe('yourBudget');
  });

  it('selects a purpose and product, clearing loan values when the product changes', () => {
    let state = journeyReducer(
      undefined,
      selectPurpose({ productId: 'personal_loan', purposeId: 'home_improvement' }),
    );
    state = journeyReducer(state, setLoanAmount(150000));
    state = journeyReducer(state, setLoanTerm(24));
    state = journeyReducer(
      state,
      selectPurpose({ productId: 'vehicle_loan', purposeId: 'new_vehicle' }),
    );

    expect(state.selectedProductId).toBe('vehicle_loan');
    expect(state.selectedPurpose).toBe('new_vehicle');
    expect(state.loanAmount).toBeNull();
    expect(state.loanTerm).toBeNull();
  });

  it('preserves credit and personal details when loan values change', () => {
    let state = journeyReducer(undefined, setManualCreditScore(700));
    state = journeyReducer(state, setCreditCheckScore(620));
    state = journeyReducer(
      state,
      setPersonalDetails({
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      }),
    );
    state = journeyReducer(state, setLoanAmount(50000));

    expect(state.manualCreditScore).toBe(700);
    expect(state.creditCheckScore).toBe(620);
    expect(state.personalDetails.age).toBe(35);
  });

  it('invalidates rate quote and eligibility when loan inputs change', () => {
    let state = journeyReducer(
      undefined,
      selectPurpose({ productId: 'personal_loan', purposeId: 'education' }),
    );
    state = journeyReducer(state, setLoanAmount(150000));
    state = journeyReducer(state, setLoanTerm(24));
    state = journeyReducer(
      state,
      setRateQuote({
        quote: sampleQuote,
        inputs: {
          loanType: 'personal_loan',
          loanAmount: 150000,
          loanTerm: 24,
          creditScore: null,
        },
      }),
    );
    state = journeyReducer(
      state,
      setEligibilityResult({
        eligibilityResult: {
          isEligible: true,
          approvalLikelihood: 80,
          riskCategory: 'low',
          decisionReason: 'ok',
        },
        recommendedLoan: {
          maxAmount: 180000,
          recommendedAmount: 150000,
          interestRate: 12.5,
          monthlyPayment: 100,
          totalRepayment: 2400,
        },
        affordabilityAnalysis: {
          disposableIncome: 10000,
          debtToIncomeRatio: 20,
          loanToIncomeRatio: 60,
          affordabilityScore: 'good',
        },
      }),
    );

    state = journeyReducer(state, setLoanAmount(160000));

    expect(state.rateQuote).toBeNull();
    expect(state.eligibilityResult).toBeNull();
  });

  it('reports continue mode when the stored quote matches current inputs', () => {
    let state = journeyReducer(
      undefined,
      selectPurpose({ productId: 'personal_loan', purposeId: 'medical' }),
    );
    state = journeyReducer(state, setLoanAmount(150000));
    state = journeyReducer(state, setLoanTerm(24));
    state = journeyReducer(
      state,
      setRateQuote({
        quote: sampleQuote,
        inputs: {
          loanType: 'personal_loan',
          loanAmount: 150000,
          loanTerm: 24,
          creditScore: null,
        },
      }),
    );

    const root = { journey: state };
    expect(selectRateQuoteMatchesCurrentInputs(root)).toBe(true);
    expect(selectPrimaryActionMode(root)).toBe('continue');
  });

  it('resets the journey to the initial state', () => {
    const dirty = journeyReducer(
      journeyReducer(undefined, setCurrentScreen('yourResult')),
      setLoanAmount(10000),
    );
    const state = journeyReducer(dirty, resetJourney());
    expect(state.currentScreen).toBe(INITIAL_JOURNEY_SCREEN);
    expect(state.loanAmount).toBeNull();
  });
});
