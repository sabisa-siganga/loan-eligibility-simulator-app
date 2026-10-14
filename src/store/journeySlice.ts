import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CalculateRateResponse, EligibilityResponse } from '../types/api';
import { resolveEffectiveCreditScore } from '../utils/resolveEffectiveCreditScore';

export const JOURNEY_SCREENS = ['loanDetails', 'yourBudget', 'yourResult'] as const;

export type JourneyScreen = (typeof JOURNEY_SCREENS)[number];

export type RateQuoteInputs = {
  readonly loanType: string;
  readonly loanAmount: number;
  readonly loanTerm: number;
  readonly creditScore: number | null;
};

export type PersonalDetailsDraft = {
  readonly age: number | null;
  readonly employmentStatus: string | null;
  readonly employmentDuration: number | null;
};

export type FinancialDetailsDraft = {
  readonly monthlyIncome: number | null;
  readonly monthlyExpenses: number | null;
  readonly existingDebt: number | null;
};

export type EligibilityInputs = {
  readonly age: number;
  readonly employmentStatus: string;
  readonly employmentDuration: number;
  readonly monthlyIncome: number;
  readonly monthlyExpenses: number;
  readonly existingDebt: number;
  readonly creditScore: number | null;
  readonly requestedAmount: number;
  readonly loanTerm: number;
  readonly loanPurpose: string;
  readonly productId: string;
};

export type JourneyState = {
  currentScreen: JourneyScreen;
  selectedProductId: string | null;
  selectedPurpose: string | null;
  loanAmount: number | null;
  loanTerm: number | null;
  manualCreditScore: number | null;
  creditCheckScore: number | null;
  creditCheckOptIn: boolean;
  rateQuote: CalculateRateResponse | null;
  rateQuoteInputs: RateQuoteInputs | null;
  eligibilityResult: EligibilityResponse | null;
  eligibilityInputs: EligibilityInputs | null;
  personalDetails: PersonalDetailsDraft;
  financialDetails: FinancialDetailsDraft;
};

export const INITIAL_JOURNEY_SCREEN: JourneyScreen = 'loanDetails';

const emptyPersonalDetails: PersonalDetailsDraft = {
  age: null,
  employmentStatus: null,
  employmentDuration: null,
};

const emptyFinancialDetails: FinancialDetailsDraft = {
  monthlyIncome: null,
  monthlyExpenses: null,
  existingDebt: null,
};

export const initialJourneyState: JourneyState = {
  currentScreen: INITIAL_JOURNEY_SCREEN,
  selectedProductId: null,
  selectedPurpose: null,
  loanAmount: null,
  loanTerm: null,
  manualCreditScore: null,
  creditCheckScore: null,
  creditCheckOptIn: false,
  rateQuote: null,
  rateQuoteInputs: null,
  eligibilityResult: null,
  eligibilityInputs: null,
  personalDetails: emptyPersonalDetails,
  financialDetails: emptyFinancialDetails,
};

const invalidateDownstreamResults = (state: JourneyState): void => {
  // Keep rateQuote + rateQuoteInputs so Screen 1 can show Recalculate when
  // the stored quote no longer matches the current draft inputs.
  state.eligibilityResult = null;
  state.eligibilityInputs = null;
};

const journeySlice = createSlice({
  name: 'journey',
  initialState: initialJourneyState,
  reducers: {
    setCurrentScreen(state, action: PayloadAction<JourneyScreen>) {
      state.currentScreen = action.payload;
    },
    selectPurpose(state, action: PayloadAction<{ productId: string; purposeId: string }>) {
      const productChanged = state.selectedProductId !== action.payload.productId;
      state.selectedProductId = action.payload.productId;
      state.selectedPurpose = action.payload.purposeId;

      if (productChanged) {
        state.loanAmount = null;
        state.loanTerm = null;
      }

      invalidateDownstreamResults(state);
    },
    clearLoanSelection(state) {
      state.selectedProductId = null;
      state.selectedPurpose = null;
      state.loanAmount = null;
      state.loanTerm = null;
      state.rateQuote = null;
      state.rateQuoteInputs = null;
      invalidateDownstreamResults(state);
    },
    setLoanAmount(state, action: PayloadAction<number | null>) {
      state.loanAmount = action.payload;
      invalidateDownstreamResults(state);
    },
    setLoanTerm(state, action: PayloadAction<number | null>) {
      state.loanTerm = action.payload;
      invalidateDownstreamResults(state);
    },
    setManualCreditScore(state, action: PayloadAction<number | null>) {
      state.manualCreditScore = action.payload;
      if (action.payload !== null) {
        state.creditCheckOptIn = false;
      }
      invalidateDownstreamResults(state);
    },
    setCreditCheckScore(state, action: PayloadAction<number | null>) {
      state.creditCheckScore = action.payload;
      invalidateDownstreamResults(state);
    },
    setCreditCheckOptIn(state, action: PayloadAction<boolean>) {
      state.creditCheckOptIn = action.payload;
      if (action.payload === true) {
        state.manualCreditScore = null;
      }
      invalidateDownstreamResults(state);
    },
    setRateQuote(
      state,
      action: PayloadAction<{
        quote: CalculateRateResponse;
        inputs: RateQuoteInputs;
      }>,
    ) {
      state.rateQuote = action.payload.quote;
      state.rateQuoteInputs = action.payload.inputs;
      invalidateDownstreamResults(state);
    },
    clearRateQuote(state) {
      state.rateQuote = null;
      state.rateQuoteInputs = null;
      invalidateDownstreamResults(state);
    },
    setPersonalDetails(state, action: PayloadAction<PersonalDetailsDraft>) {
      const previous = state.personalDetails;
      const next = action.payload;
      const changed =
        previous.age !== next.age ||
        previous.employmentStatus !== next.employmentStatus ||
        previous.employmentDuration !== next.employmentDuration;
      state.personalDetails = next;
      if (changed) {
        invalidateDownstreamResults(state);
      }
    },
    setFinancialDetails(state, action: PayloadAction<FinancialDetailsDraft>) {
      const previous = state.financialDetails;
      const next = action.payload;
      const changed =
        previous.monthlyIncome !== next.monthlyIncome ||
        previous.monthlyExpenses !== next.monthlyExpenses ||
        previous.existingDebt !== next.existingDebt;
      state.financialDetails = next;
      if (changed) {
        invalidateDownstreamResults(state);
      }
    },
    setEligibilityResult(
      state,
      action: PayloadAction<{
        result: EligibilityResponse;
        inputs: EligibilityInputs;
      } | null>,
    ) {
      if (action.payload === null) {
        state.eligibilityResult = null;
        state.eligibilityInputs = null;
        return;
      }

      state.eligibilityResult = action.payload.result;
      state.eligibilityInputs = action.payload.inputs;
    },
    resetJourney() {
      return initialJourneyState;
    },
  },
});

export const {
  setCurrentScreen,
  selectPurpose,
  clearLoanSelection,
  setLoanAmount,
  setLoanTerm,
  setManualCreditScore,
  setCreditCheckScore,
  setCreditCheckOptIn,
  setRateQuote,
  clearRateQuote,
  setPersonalDetails,
  setFinancialDetails,
  setEligibilityResult,
  resetJourney,
} = journeySlice.actions;

export const journeyReducer = journeySlice.reducer;

export const selectCurrentScreen = (state: { journey: JourneyState }): JourneyScreen =>
  state.journey.currentScreen;

export const selectJourney = (state: { journey: JourneyState }): JourneyState => state.journey;

export const selectEffectiveCreditScoreValue = (state: {
  journey: JourneyState;
}): number | undefined =>
  resolveEffectiveCreditScore({
    entered: state.journey.manualCreditScore,
    creditCheckScore: state.journey.creditCheckScore,
    creditCheckOptIn: state.journey.creditCheckOptIn,
  });

export const selectCurrentRateInputs = (state: {
  journey: JourneyState;
}): RateQuoteInputs | null => {
  const { selectedProductId, loanAmount, loanTerm } = state.journey;
  if (selectedProductId === null || loanAmount === null || loanTerm === null) {
    return null;
  }

  const creditScore = selectEffectiveCreditScoreValue(state) ?? null;
  return {
    loanType: selectedProductId,
    loanAmount,
    loanTerm,
    creditScore,
  };
};

export const selectRateQuoteMatchesCurrentInputs = (state: { journey: JourneyState }): boolean => {
  const current = selectCurrentRateInputs(state);
  const stored = state.journey.rateQuoteInputs;
  if (!current || !stored || !state.journey.rateQuote) {
    return false;
  }

  return (
    current.loanType === stored.loanType &&
    current.loanAmount === stored.loanAmount &&
    current.loanTerm === stored.loanTerm &&
    current.creditScore === stored.creditScore
  );
};

export type PrimaryActionMode = 'calculate' | 'recalculate' | 'continue';

export const selectPrimaryActionMode = (state: { journey: JourneyState }): PrimaryActionMode => {
  if (selectRateQuoteMatchesCurrentInputs(state)) {
    return 'continue';
  }

  if (state.journey.rateQuote !== null) {
    return 'recalculate';
  }

  return 'calculate';
};

export const selectCurrentEligibilityInputs = (state: {
  journey: JourneyState;
}): EligibilityInputs | null => {
  const {
    personalDetails,
    financialDetails,
    selectedProductId,
    selectedPurpose,
    loanAmount,
    loanTerm,
  } = state.journey;

  if (
    personalDetails.age === null ||
    personalDetails.employmentStatus === null ||
    personalDetails.employmentDuration === null ||
    financialDetails.monthlyIncome === null ||
    financialDetails.monthlyExpenses === null ||
    financialDetails.existingDebt === null ||
    selectedProductId === null ||
    selectedPurpose === null ||
    loanAmount === null ||
    loanTerm === null
  ) {
    return null;
  }

  return {
    age: personalDetails.age,
    employmentStatus: personalDetails.employmentStatus,
    employmentDuration: personalDetails.employmentDuration,
    monthlyIncome: financialDetails.monthlyIncome,
    monthlyExpenses: financialDetails.monthlyExpenses,
    existingDebt: financialDetails.existingDebt,
    creditScore: selectEffectiveCreditScoreValue(state) ?? null,
    requestedAmount: loanAmount,
    loanTerm,
    loanPurpose: selectedPurpose,
    productId: selectedProductId,
  };
};

export const selectEligibilityMatchesCurrentInputs = (state: {
  journey: JourneyState;
}): boolean => {
  const current = selectCurrentEligibilityInputs(state);
  const stored = state.journey.eligibilityInputs;
  if (!current || !stored || !state.journey.eligibilityResult) {
    return false;
  }

  return (
    current.age === stored.age &&
    current.employmentStatus === stored.employmentStatus &&
    current.employmentDuration === stored.employmentDuration &&
    current.monthlyIncome === stored.monthlyIncome &&
    current.monthlyExpenses === stored.monthlyExpenses &&
    current.existingDebt === stored.existingDebt &&
    current.creditScore === stored.creditScore &&
    current.requestedAmount === stored.requestedAmount &&
    current.loanTerm === stored.loanTerm &&
    current.loanPurpose === stored.loanPurpose &&
    current.productId === stored.productId
  );
};

export type DetailsPrimaryActionMode = 'check' | 'view';

export const selectDetailsPrimaryActionMode = (state: {
  journey: JourneyState;
}): DetailsPrimaryActionMode =>
  selectEligibilityMatchesCurrentInputs(state) ? 'view' : 'check';
