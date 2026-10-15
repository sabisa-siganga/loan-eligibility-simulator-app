import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearJourneyStorage,
  JOURNEY_STORAGE_KEY,
  loadJourneyState,
  saveJourneyState,
} from './journeyPersistence';
import { createAppStore } from './store';
import { initialJourneyState, type JourneyState } from './journeySlice';

const sampleJourney: JourneyState = {
  ...initialJourneyState,
  currentScreen: 'yourBudget',
  selectedProductId: 'personal_loan',
  selectedPurpose: 'education',
  loanAmount: 25000,
  loanTerm: 18,
  personalDetails: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
};

describe('journeyPersistence', () => {
  beforeEach(() => {
    clearJourneyStorage();
  });

  it('round-trips loan fields and currentScreen through sessionStorage', () => {
    saveJourneyState(sampleJourney);

    const loaded = loadJourneyState();

    expect(loaded.currentScreen).toBe('yourBudget');
    expect(loaded.selectedProductId).toBe('personal_loan');
    expect(loaded.selectedPurpose).toBe('education');
    expect(loaded.loanAmount).toBe(25000);
    expect(loaded.loanTerm).toBe(18);
    expect(loaded.personalDetails.age).toBe(35);
  });

  it('returns initialJourneyState for garbage JSON', () => {
    sessionStorage.setItem(JOURNEY_STORAGE_KEY, '{not-json');

    expect(loadJourneyState()).toEqual(initialJourneyState);
  });

  it('returns initialJourneyState for wrong shape payloads', () => {
    sessionStorage.setItem(
      JOURNEY_STORAGE_KEY,
      JSON.stringify({ currentScreen: 'loanDetails', loanAmount: 'nope' }),
    );

    expect(loadJourneyState()).toEqual(initialJourneyState);
  });

  it('hydrates createAppStore from sessionStorage when journey preload is omitted', () => {
    saveJourneyState(sampleJourney);

    const store = createAppStore();

    expect(store.getState().journey.selectedPurpose).toBe('education');
    expect(store.getState().journey.loanAmount).toBe(25000);
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
  });

  it('lets explicit preloadedState.journey win over sessionStorage', () => {
    saveJourneyState(sampleJourney);

    const store = createAppStore({
      journey: {
        ...initialJourneyState,
        selectedPurpose: 'medical',
        loanAmount: 10000,
      },
    });

    expect(store.getState().journey.selectedPurpose).toBe('medical');
    expect(store.getState().journey.loanAmount).toBe(10000);
  });

  it('persists journey changes from the store subscribe hook', () => {
    const store = createAppStore({ journey: initialJourneyState });

    store.dispatch({
      type: 'journey/selectPurpose',
      payload: { productId: 'personal_loan', purposeId: 'home_improvement' },
    });

    expect(loadJourneyState().selectedPurpose).toBe('home_improvement');
    expect(loadJourneyState().selectedProductId).toBe('personal_loan');
  });
});
