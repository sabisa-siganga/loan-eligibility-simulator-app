import type { CreditCheckState } from '../types/api';
import {
  CREDIT_CHECK_STATES,
  initialJourneyState,
  JOURNEY_SCREENS,
  type JourneyScreen,
  type JourneyState,
} from './journeySlice';

export const JOURNEY_STORAGE_KEY = 'loanEligibility.journey.v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJourneyScreen = (value: unknown): value is JourneyScreen =>
  typeof value === 'string' && (JOURNEY_SCREENS as readonly string[]).includes(value);

const isCreditCheckState = (value: unknown): value is CreditCheckState =>
  typeof value === 'string' && (CREDIT_CHECK_STATES as readonly string[]).includes(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value));

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isPersonalDetails = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNullableNumber(value.age) &&
    isNullableString(value.employmentStatus) &&
    isNullableNumber(value.employmentDuration)
  );
};

const isFinancialDetails = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNullableNumber(value.monthlyIncome) &&
    isNullableNumber(value.monthlyExpenses) &&
    isNullableNumber(value.existingDebt)
  );
};

export const isJourneyState = (value: unknown): value is JourneyState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isJourneyScreen(value.currentScreen) &&
    isNullableString(value.selectedProductId) &&
    isNullableString(value.selectedPurpose) &&
    isNullableNumber(value.loanAmount) &&
    isNullableNumber(value.loanTerm) &&
    isNullableNumber(value.manualCreditScore) &&
    isNullableNumber(value.creditCheckScore) &&
    typeof value.creditCheckOptIn === 'boolean' &&
    isCreditCheckState(value.creditCheckState) &&
    isPersonalDetails(value.personalDetails) &&
    isFinancialDetails(value.financialDetails) &&
    'rateQuote' in value &&
    'rateQuoteInputs' in value &&
    'eligibilityResult' in value &&
    'eligibilityInputs' in value
  );
};

export const loadJourneyState = (): JourneyState => {
  try {
    if (typeof sessionStorage === 'undefined') {
      return initialJourneyState;
    }
    const raw = sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    if (raw === null) {
      return initialJourneyState;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isJourneyState(parsed)) {
      return initialJourneyState;
    }
    return parsed;
  } catch {
    return initialJourneyState;
  }
};

export const saveJourneyState = (state: JourneyState): void => {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // QuotaExceeded or security restrictions — drafts are best-effort.
  }
};

export const clearJourneyStorage = (): void => {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.removeItem(JOURNEY_STORAGE_KEY);
  } catch {
    // Ignore storage access failures in tests or restricted contexts.
  }
};
