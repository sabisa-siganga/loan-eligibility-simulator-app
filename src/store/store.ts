import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { catalogReducer } from './catalogSlice';
import { loadJourneyState, saveJourneyState } from './journeyPersistence';
import { journeyReducer } from './journeySlice';

const rootReducer = combineReducers({
  catalog: catalogReducer,
  journey: journeyReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) => {
  const journey = preloadedState?.journey ?? loadJourneyState();
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...preloadedState,
      journey,
    },
    devTools: import.meta.env.DEV,
  });

  store.subscribe(() => {
    saveJourneyState(store.getState().journey);
  });

  return store;
};

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
