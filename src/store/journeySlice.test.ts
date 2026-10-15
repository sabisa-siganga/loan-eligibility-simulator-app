import { describe, expect, it } from 'vitest';

import {
  clearLoanSelection,
  clearRateQuote,
  INITIAL_JOURNEY_SCREEN,
  journeyReducer,
  resetJourney,
  selectDetailsPrimaryActionMode,
  selectEffectiveCreditScoreValue,
  selectEligibilityMatchesCurrentInputs,
  selectPrimaryActionMode,
  selectPurpose,
  selectRateQuoteMatchesCurrentInputs,
  setCreditCheckOptIn,
  setCreditCheckScore,
  setCreditCheckState,
  setCurrentScreen,
  setEligibilityResult,
  setFinancialDetails,
  setLoanAmount,
  setLoanTerm,
  setManualCreditScore,
  setPersonalDetails,
  setRateQuote,
  type EligibilityInputs,
} from './journeySlice';

const sampleQuote = {
  interestRate: 12.5,
  monthlyPayment: 100,
  totalInterest: 200,
  totalRepayment: 2400,
  paymentSchedule: [],
};

const sampleEligibilityResult = {
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
};

const sampleEligibilityInputs = (): EligibilityInputs => ({
  age: 35,
  employmentStatus: 'employed',
  employmentDuration: 24,
  monthlyIncome: 25000,
  monthlyExpenses: 10000,
  existingDebt: 1000,
  creditScore: null,
  requestedAmount: 150000,
  loanTerm: 24,
  loanPurpose: 'education',
  productId: 'personal_loan',
});

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

  it('clears loan selection and quote while preserving credit scores', () => {
    let state = journeyReducer(
      undefined,
      selectPurpose({ productId: 'personal_loan', purposeId: 'home_improvement' }),
    );
    state = journeyReducer(state, setLoanAmount(150000));
    state = journeyReducer(state, setLoanTerm(24));
    state = journeyReducer(state, setManualCreditScore(700));
    state = journeyReducer(state, setCreditCheckScore(620));
    state = journeyReducer(
      state,
      setRateQuote({
        quote: sampleQuote,
        inputs: {
          loanType: 'personal_loan',
          loanAmount: 150000,
          loanTerm: 24,
          creditScore: 700,
        },
      }),
    );

    state = journeyReducer(state, clearLoanSelection());

    expect(state.selectedProductId).toBeNull();
    expect(state.selectedPurpose).toBeNull();
    expect(state.loanAmount).toBeNull();
    expect(state.loanTerm).toBeNull();
    expect(state.rateQuote).toBeNull();
    expect(state.rateQuoteInputs).toBeNull();
    expect(state.manualCreditScore).toBe(700);
    expect(state.creditCheckScore).toBe(620);
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

  it('keeps the previous quote but clears eligibility when loan inputs change', () => {
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
        result: sampleEligibilityResult,
        inputs: sampleEligibilityInputs(),
      }),
    );

    state = journeyReducer(state, setLoanAmount(160000));

    expect(state.rateQuote).toEqual(sampleQuote);
    expect(state.eligibilityResult).toBeNull();
    expect(state.eligibilityInputs).toBeNull();
    expect(selectPrimaryActionMode({ journey: state })).toBe('recalculate');
  });

  it('clears eligibility when personal or financial drafts change', () => {
    let state = journeyReducer(
      undefined,
      selectPurpose({ productId: 'personal_loan', purposeId: 'education' }),
    );
    state = journeyReducer(state, setLoanAmount(150000));
    state = journeyReducer(state, setLoanTerm(24));
    state = journeyReducer(
      state,
      setPersonalDetails({
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      }),
    );
    state = journeyReducer(
      state,
      setFinancialDetails({
        monthlyIncome: 25000,
        monthlyExpenses: 10000,
        existingDebt: 1000,
      }),
    );
    state = journeyReducer(
      state,
      setEligibilityResult({
        result: sampleEligibilityResult,
        inputs: sampleEligibilityInputs(),
      }),
    );

    state = journeyReducer(
      state,
      setPersonalDetails({
        age: 36,
        employmentStatus: 'employed',
        employmentDuration: 24,
      }),
    );

    expect(state.eligibilityResult).toBeNull();
    expect(selectDetailsPrimaryActionMode({ journey: state })).toBe('check');
  });

  it('reports view mode when stored eligibility matches current inputs', () => {
    let state = journeyReducer(
      undefined,
      selectPurpose({ productId: 'personal_loan', purposeId: 'education' }),
    );
    state = journeyReducer(state, setLoanAmount(150000));
    state = journeyReducer(state, setLoanTerm(24));
    state = journeyReducer(
      state,
      setPersonalDetails({
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      }),
    );
    state = journeyReducer(
      state,
      setFinancialDetails({
        monthlyIncome: 25000,
        monthlyExpenses: 10000,
        existingDebt: 1000,
      }),
    );
    state = journeyReducer(
      state,
      setEligibilityResult({
        result: sampleEligibilityResult,
        inputs: sampleEligibilityInputs(),
      }),
    );

    const root = { journey: state };
    expect(selectEligibilityMatchesCurrentInputs(root)).toBe(true);
    expect(selectDetailsPrimaryActionMode(root)).toBe('view');
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

  it('clears a stored rate quote on demand and stores budget drafts', () => {
    let state = journeyReducer(
      undefined,
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
    state = journeyReducer(state, clearRateQuote());
    expect(state.rateQuote).toBeNull();

    state = journeyReducer(
      state,
      setFinancialDetails({
        monthlyIncome: 25000,
        monthlyExpenses: 10000,
        existingDebt: 1000,
      }),
    );
    expect(state.financialDetails.monthlyIncome).toBe(25000);
  });

  it('defaults creditCheckOptIn to false', () => {
    const state = journeyReducer(undefined, { type: 'unknown' });
    expect(state.creditCheckOptIn).toBe(false);
  });

  it('defaults creditCheckState to good', () => {
    const state = journeyReducer(undefined, { type: 'unknown' });
    expect(state.creditCheckState).toBe('good');
  });

  it('updates creditCheckState and clears a prior credit-check score', () => {
    let state = journeyReducer(undefined, setCreditCheckOptIn(true));
    state = journeyReducer(state, setCreditCheckScore(680));
    state = journeyReducer(state, setCreditCheckState('bad'));
    expect(state.creditCheckState).toBe('bad');
    expect(state.creditCheckScore).toBeNull();
  });

  it('keeps creditCheckState when opt-in is turned off', () => {
    let state = journeyReducer(undefined, setCreditCheckState('over_limit'));
    state = journeyReducer(state, setCreditCheckOptIn(true));
    state = journeyReducer(state, setCreditCheckOptIn(false));
    expect(state.creditCheckOptIn).toBe(false);
    expect(state.creditCheckState).toBe('over_limit');
  });

  it('clears opt-in when a manual credit score is set', () => {
    let state = journeyReducer(undefined, setCreditCheckOptIn(true));
    state = journeyReducer(state, setManualCreditScore(710));
    expect(state.creditCheckOptIn).toBe(false);
    expect(state.manualCreditScore).toBe(710);
  });

  it('clears manual credit score when opt-in is enabled', () => {
    let state = journeyReducer(undefined, setManualCreditScore(710));
    state = journeyReducer(state, setCreditCheckOptIn(true));
    expect(state.creditCheckOptIn).toBe(true);
    expect(state.manualCreditScore).toBeNull();
  });

  it('does not use stale credit-check score in selector when opt-in is false', () => {
    const state = journeyReducer(undefined, setCreditCheckScore(680));
    expect(selectEffectiveCreditScoreValue({ journey: state })).toBeUndefined();
  });

  it('uses credit-check score in selector when opted in', () => {
    let state = journeyReducer(undefined, setCreditCheckOptIn(true));
    state = journeyReducer(state, setCreditCheckScore(680));
    expect(selectEffectiveCreditScoreValue({ journey: state })).toBe(680);
  });
});
