import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CalculateRateResponse, CreditCheckState, EligibilityResponse } from '../types/api';
import { resolveEffectiveCreditScore } from '../utils/resolveEffectiveCreditScore';

/**
 * Journey slice owns the multi-step loan application draft.
 *
 * Downstream endpoint results (rate quote, eligibility) are stored with the inputs
 * that produced them. Selectors compare those fingerprints to current drafts so
 * the user interface can distinguish "fresh result" versus "stale — recalculate / re-check".
 */

/** Allowed mock credit-check scenario identifiers used by the bureau opt-in flow. */
export const CREDIT_CHECK_STATES = ['bad', 'good', 'over_limit'] as const;

/** Default bureau scenario when the user has not picked one. */
export const DEFAULT_CREDIT_CHECK_STATE: CreditCheckState = 'good';

/** Ordered journey screen identifiers used for typing and persistence guards. */
export const JOURNEY_SCREENS = ['loanDetails', 'yourBudget', 'yourResult'] as const;

/** One of the three journey steps. */
export type JourneyScreen = (typeof JOURNEY_SCREENS)[number];

/**
 * Fingerprint of inputs that produced a cached rate quote.
 * Compared to the live draft to detect stale quotes.
 */
export type RateQuoteInputs = {
  readonly loanType: string;
  readonly loanAmount: number;
  readonly loanTerm: number;
  readonly creditScore: number | null;
};

/** Editable personal fields on the details step (nullable until filled). */
export type PersonalDetailsDraft = {
  readonly age: number | null;
  readonly employmentStatus: string | null;
  readonly employmentDuration: number | null;
};

/** Editable financial fields on the details step (nullable until filled). */
export type FinancialDetailsDraft = {
  readonly monthlyIncome: number | null;
  readonly monthlyExpenses: number | null;
  readonly existingDebt: number | null;
};

/**
 * Fingerprint of inputs that produced a cached eligibility result.
 * All fields are required once built from a complete draft.
 */
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

/**
 * Full journey draft plus cached endpoint results and their input fingerprints.
 */
export type JourneyState = {
  currentScreen: JourneyScreen;
  selectedProductId: string | null;
  selectedPurpose: string | null;
  loanAmount: number | null;
  loanTerm: number | null;
  manualCreditScore: number | null;
  creditCheckScore: number | null;
  creditCheckOptIn: boolean;
  creditCheckState: CreditCheckState;
  rateQuote: CalculateRateResponse | null;
  rateQuoteInputs: RateQuoteInputs | null;
  eligibilityResult: EligibilityResponse | null;
  eligibilityInputs: EligibilityInputs | null;
  personalDetails: PersonalDetailsDraft;
  financialDetails: FinancialDetailsDraft;
};

/** Screen shown when the journey is first created or reset. */
export const INITIAL_JOURNEY_SCREEN: JourneyScreen = 'loanDetails';

/** Empty personal-details draft used in initial/reset state. */
const emptyPersonalDetails: PersonalDetailsDraft = {
  age: null,
  employmentStatus: null,
  employmentDuration: null,
};

/** Empty financial-details draft used in initial/reset state. */
const emptyFinancialDetails: FinancialDetailsDraft = {
  monthlyIncome: null,
  monthlyExpenses: null,
  existingDebt: null,
};

/** Clean journey: first screen, no selections, no cached endpoint results. */
export const initialJourneyState: JourneyState = {
  currentScreen: INITIAL_JOURNEY_SCREEN,
  selectedProductId: null,
  selectedPurpose: null,
  loanAmount: null,
  loanTerm: null,
  manualCreditScore: null,
  creditCheckScore: null,
  creditCheckOptIn: false,
  creditCheckState: DEFAULT_CREDIT_CHECK_STATE,
  rateQuote: null,
  rateQuoteInputs: null,
  eligibilityResult: null,
  eligibilityInputs: null,
  personalDetails: emptyPersonalDetails,
  financialDetails: emptyFinancialDetails,
};

/**
 * Clears eligibility when upstream drafts change.
 * Rate quotes are left in place so selectors can still detect a mismatch and
 * surface recalculate/continue modes without forcing an immediate refetch.
 */
const invalidateDownstreamResults = (state: JourneyState): void => {
  state.eligibilityResult = null;
  state.eligibilityInputs = null;
};

const journeySlice = createSlice({
  name: 'journey',
  initialState: initialJourneyState,
  reducers: {
    /** Updates which journey screen is active. */
    setCurrentScreen(state, action: PayloadAction<JourneyScreen>) {
      state.currentScreen = action.payload;
    },
    /**
     * Selects product + purpose. Changing product clears amount/term.
     * Always invalidates eligibility; rate quote is left for mismatch detection.
     */
    selectPurpose(state, action: PayloadAction<{ productId: string; purposeId: string }>) {
      const productChanged = state.selectedProductId !== action.payload.productId;
      state.selectedProductId = action.payload.productId;
      state.selectedPurpose = action.payload.purposeId;

      /** Product switch resets amount/term so product-specific bounds apply cleanly. */
      if (productChanged) {
        state.loanAmount = null;
        state.loanTerm = null;
      }

      invalidateDownstreamResults(state);
    },
    /**
     * Clears product/purpose selection, loan amount/term, and rate quote.
     * Also invalidates eligibility.
     */
    clearLoanSelection(state) {
      state.selectedProductId = null;
      state.selectedPurpose = null;
      state.loanAmount = null;
      state.loanTerm = null;
      state.rateQuote = null;
      state.rateQuoteInputs = null;
      invalidateDownstreamResults(state);
    },
    /** Sets loan amount and invalidates eligibility. */
    setLoanAmount(state, action: PayloadAction<number | null>) {
      state.loanAmount = action.payload;
      invalidateDownstreamResults(state);
    },
    /** Sets loan term (months) and invalidates eligibility. */
    setLoanTerm(state, action: PayloadAction<number | null>) {
      state.loanTerm = action.payload;
      invalidateDownstreamResults(state);
    },
    /**
     * Sets the manually entered credit score.
     * A non-null score turns off bureau opt-in (sources are mutually exclusive).
     */
    setManualCreditScore(state, action: PayloadAction<number | null>) {
      state.manualCreditScore = action.payload;
      /** Non-null manual score disables credit-check opt-in. */
      if (action.payload !== null) {
        state.creditCheckOptIn = false;
      }
      invalidateDownstreamResults(state);
    },
    /** Stores the score returned from a bureau credit check. */
    setCreditCheckScore(state, action: PayloadAction<number | null>) {
      state.creditCheckScore = action.payload;
      invalidateDownstreamResults(state);
    },
    /**
     * Toggles bureau credit-check opt-in.
     * Opting in clears any manually entered score.
     */
    setCreditCheckOptIn(state, action: PayloadAction<boolean>) {
      state.creditCheckOptIn = action.payload;
      /** Opting into bureau check clears the manual score. */
      if (action.payload === true) {
        state.manualCreditScore = null;
      }
      invalidateDownstreamResults(state);
    },
    /**
     * Changes the mock credit-check scenario and clears any prior bureau score
     * so a new check must run for the new scenario.
     */
    setCreditCheckState(state, action: PayloadAction<CreditCheckState>) {
      state.creditCheckState = action.payload;
      state.creditCheckScore = null;
      invalidateDownstreamResults(state);
    },
    /**
     * Caches a rate quote with the inputs that produced it.
     * Invalidates eligibility because quote changes can affect affordability.
     */
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
    /** Clears the cached rate quote and its input fingerprint. */
    clearRateQuote(state) {
      state.rateQuote = null;
      state.rateQuoteInputs = null;
      invalidateDownstreamResults(state);
    },
    /**
     * Replaces personal details. Invalidates eligibility only when a field
     * actually changed (avoids wiping results on no-op updates).
     */
    setPersonalDetails(state, action: PayloadAction<PersonalDetailsDraft>) {
      const previous = state.personalDetails;
      const next = action.payload;
      const changed =
        previous.age !== next.age ||
        previous.employmentStatus !== next.employmentStatus ||
        previous.employmentDuration !== next.employmentDuration;
      state.personalDetails = next;
      /** Skip invalidation when the draft is unchanged. */
      if (changed) {
        invalidateDownstreamResults(state);
      }
    },
    /**
     * Replaces financial details. Invalidates eligibility only when a field
     * actually changed.
     */
    setFinancialDetails(state, action: PayloadAction<FinancialDetailsDraft>) {
      const previous = state.financialDetails;
      const next = action.payload;
      const changed =
        previous.monthlyIncome !== next.monthlyIncome ||
        previous.monthlyExpenses !== next.monthlyExpenses ||
        previous.existingDebt !== next.existingDebt;
      state.financialDetails = next;
      /** Skip invalidation when the draft is unchanged. */
      if (changed) {
        invalidateDownstreamResults(state);
      }
    },
    /**
     * Stores or clears eligibility. Null payload clears both result and fingerprint;
     * non-null stores the result with the inputs that produced it.
     */
    setEligibilityResult(
      state,
      action: PayloadAction<{
        result: EligibilityResponse;
        inputs: EligibilityInputs;
      } | null>,
    ) {
      /** Explicit clear of cached eligibility. */
      if (action.payload === null) {
        state.eligibilityResult = null;
        state.eligibilityInputs = null;
        return;
      }

      state.eligibilityResult = action.payload.result;
      state.eligibilityInputs = action.payload.inputs;
    },
    /** Returns the journey to a clean initial draft (full replace). */
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
  setCreditCheckState,
  setRateQuote,
  clearRateQuote,
  setPersonalDetails,
  setFinancialDetails,
  setEligibilityResult,
  resetJourney,
} = journeySlice.actions;

export const journeyReducer = journeySlice.reducer;

/** Active journey screen identifier. */
export const selectCurrentScreen = (state: { journey: JourneyState }): JourneyScreen =>
  state.journey.currentScreen;

/** Full journey slice state. */
export const selectJourney = (state: { journey: JourneyState }): JourneyState => state.journey;

/**
 * Effective credit score from manual entry versus bureau opt-in.
 * Delegates to `resolveEffectiveCreditScore`; may be undefined when neither applies.
 */
export const selectEffectiveCreditScoreValue = (state: {
  journey: JourneyState;
}): number | undefined =>
  resolveEffectiveCreditScore({
    entered: state.journey.manualCreditScore,
    creditCheckScore: state.journey.creditCheckScore,
    creditCheckOptIn: state.journey.creditCheckOptIn,
  });

/**
 * Builds the rate-quote fingerprint from the live draft.
 * Returns null when product, amount, or term is still missing.
 */
export const selectCurrentRateInputs = (state: {
  journey: JourneyState;
}): RateQuoteInputs | null => {
  const { selectedProductId, loanAmount, loanTerm } = state.journey;
  /** Incomplete loan selection — cannot build a rate fingerprint. */
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

/**
 * True when a cached rate quote exists and was computed from the current draft
 * inputs (product, amount, term, effective credit score).
 */
export const selectRateQuoteMatchesCurrentInputs = (state: { journey: JourneyState }): boolean => {
  const current = selectCurrentRateInputs(state);
  const stored = state.journey.rateQuoteInputs;
  /** Missing draft fingerprint, stored fingerprint, or quote → not a match. */
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

/** Loan-step primary call to action modes driven by quote freshness. */
export type PrimaryActionMode = 'calculate' | 'recalculate' | 'continue';

/**
 * Primary call to action on the loan step when rate quoting is enabled:
 * continue (quote still valid) → recalculate (stale quote) → calculate (none).
 */
export const selectPrimaryActionMode = (state: { journey: JourneyState }): PrimaryActionMode => {
  /** Fresh quote matching current inputs → continue to next step. */
  if (selectRateQuoteMatchesCurrentInputs(state)) {
    return 'continue';
  }

  /** Stale quote still cached → ask the user to recalculate. */
  if (state.journey.rateQuote !== null) {
    return 'recalculate';
  }

  /** No quote yet → calculate. */
  return 'calculate';
};

/**
 * Builds the eligibility fingerprint from the live draft, or null when required
 * fields are still missing. `existingDebt` defaults to 0 when left blank.
 */
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

  /**
   * Any required draft field still null → cannot build an eligibility fingerprint.
   * Note: existingDebt may be null and is defaulted to 0 below.
   */
  if (
    personalDetails.age === null ||
    personalDetails.employmentStatus === null ||
    personalDetails.employmentDuration === null ||
    financialDetails.monthlyIncome === null ||
    financialDetails.monthlyExpenses === null ||
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
    existingDebt: financialDetails.existingDebt ?? 0,
    creditScore: selectEffectiveCreditScoreValue(state) ?? null,
    requestedAmount: loanAmount,
    loanTerm,
    loanPurpose: selectedPurpose,
    productId: selectedProductId,
  };
};

/**
 * True when a cached eligibility result exists and every field in its stored
 * fingerprint still matches the live draft.
 */
export const selectEligibilityMatchesCurrentInputs = (state: {
  journey: JourneyState;
}): boolean => {
  const current = selectCurrentEligibilityInputs(state);
  const stored = state.journey.eligibilityInputs;
  /** Missing draft fingerprint, stored fingerprint, or result → not a match. */
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

/** Details-step primary call to action modes: re-check versus view cached result. */
export type DetailsPrimaryActionMode = 'check' | 'view';

/**
 * Details-step call to action: `view` when the cached eligibility result is still current;
 * otherwise `check` (call the endpoint).
 */
export const selectDetailsPrimaryActionMode = (state: {
  journey: JourneyState;
}): DetailsPrimaryActionMode => (selectEligibilityMatchesCurrentInputs(state) ? 'view' : 'check');
