import { describe, expect, it } from 'vitest';

import {
  INITIAL_JOURNEY_SCREEN,
  journeyReducer,
  resetJourney,
  setCurrentScreen,
} from './journeySlice';

describe('journey slice', () => {
  it('starts on Loan details', () => {
    const state = journeyReducer(undefined, { type: 'unknown' });

    expect(state.currentScreen).toBe(INITIAL_JOURNEY_SCREEN);
    expect(state.currentScreen).toBe('loanDetails');
  });

  it('updates the current screen', () => {
    const state = journeyReducer(undefined, setCurrentScreen('yourBudget'));

    expect(state.currentScreen).toBe('yourBudget');
  });

  it('resets the journey back to Loan details', () => {
    const advanced = journeyReducer(undefined, setCurrentScreen('yourResult'));
    const reset = journeyReducer(advanced, resetJourney());

    expect(reset.currentScreen).toBe('loanDetails');
  });
});
