import type { CreditCheckState } from '../types/api';
import {
  CREDIT_CHECK_STATES,
  initialJourneyState,
  JOURNEY_SCREENS,
  type JourneyScreen,
  type JourneyState,
} from './journeySlice';

/**
 * Session persistence for the journey draft (survives refresh within the tab).
 * Corrupt, incomplete, or inaccessible storage always falls back to a clean
 * initial state — never throw into the app boot path.
 */

/** sessionStorage key for the versioned journey draft payload. */
export const JOURNEY_STORAGE_KEY = 'loanEligibility.journey.v1';

/** True when value is a plain object (not null or an array). */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** True when value is one of the known journey screen identifiers. */
const isJourneyScreen = (value: unknown): value is JourneyScreen =>
  typeof value === 'string' && (JOURNEY_SCREENS as readonly string[]).includes(value);

/** True when value is one of the known credit-check scenario identifiers. */
const isCreditCheckState = (value: unknown): value is CreditCheckState =>
  typeof value === 'string' && (CREDIT_CHECK_STATES as readonly string[]).includes(value);

/** True when value is null or a finite number. */
const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value));

/** True when value is null or a string. */
const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

/**
 * Structural check for the personal-details draft shape.
 * Rejects non-objects; requires nullable age, employmentStatus, employmentDuration.
 */
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

/**
 * Structural check for the financial-details draft shape.
 * Rejects non-objects; requires nullable income, expenses, and existing debt.
 */
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

/**
 * Structural guard for sessionStorage payloads. Nested endpoint result shapes are
 * only checked for presence — they were written by this app in the same session.
 */
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

/**
 * Hydrate journey state from sessionStorage.
 * Falls back to `initialJourneyState` when storage is missing, empty, corrupt,
 * or unavailable (SSR/tests). Never throws.
 */
export const loadJourneyState = (): JourneyState => {
  try {
    /** No sessionStorage available (for example non-browser) → clean initial state. */
    if (typeof sessionStorage === 'undefined') {
      return initialJourneyState;
    }
    const raw = sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    /** No saved draft for this key → clean initial state. */
    if (raw === null) {
      return initialJourneyState;
    }
    const parsed: unknown = JSON.parse(raw);
    /** Parsed storage payload fails structural guard → discard and start fresh. */
    if (!isJourneyState(parsed)) {
      return initialJourneyState;
    }
    return parsed;
  } catch {
    /** Payload parse or storage access failure → clean initial state. */
    return initialJourneyState;
  }
};

/**
 * Persist the journey draft to sessionStorage as a string payload.
 * No-ops when storage is unavailable; swallows quota/security errors.
 */
export const saveJourneyState = (state: JourneyState): void => {
  try {
    /** Skip write when sessionStorage is not available. */
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /**
     * QuotaExceeded or security restrictions — drafts are best-effort.
     * Swallow so user interface updates are never blocked by persistence.
     */
  }
};

/**
 * Remove the journey draft from sessionStorage.
 * No-ops when storage is unavailable; ignores access failures.
 */
export const clearJourneyStorage = (): void => {
  try {
    /** Skip remove when sessionStorage is not available. */
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.removeItem(JOURNEY_STORAGE_KEY);
  } catch {
    /** Ignore storage access failures in tests or restricted contexts. */
  }
};
