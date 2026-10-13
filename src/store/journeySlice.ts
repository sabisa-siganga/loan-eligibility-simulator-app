import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const JOURNEY_SCREENS = ['loanDetails', 'yourBudget', 'yourResult'] as const;

export type JourneyScreen = (typeof JOURNEY_SCREENS)[number];

export type JourneyState = {
  currentScreen: JourneyScreen;
};

export const INITIAL_JOURNEY_SCREEN: JourneyScreen = 'loanDetails';

const initialState: JourneyState = {
  currentScreen: INITIAL_JOURNEY_SCREEN,
};

const journeySlice = createSlice({
  name: 'journey',
  initialState,
  reducers: {
    setCurrentScreen(state, action: PayloadAction<JourneyScreen>) {
      state.currentScreen = action.payload;
    },
    resetJourney() {
      return initialState;
    },
  },
});

export const { setCurrentScreen, resetJourney } = journeySlice.actions;
export const journeyReducer = journeySlice.reducer;

export const selectCurrentScreen = (state: { journey: JourneyState }): JourneyScreen =>
  state.journey.currentScreen;
