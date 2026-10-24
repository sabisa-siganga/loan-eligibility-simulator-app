import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { catalogReducer } from './catalogSlice';
import { loadJourneyState, saveJourneyState } from './journeyPersistence';
import { journeyReducer } from './journeySlice';

/** Combines catalog (boot data) and journey (draft + results) reducers. */
const rootReducer = combineReducers({
  catalog: catalogReducer,
  journey: journeyReducer,
});

/** Inferred root state from the combined reducers. */
export type RootState = ReturnType<typeof rootReducer>;

/**
 * Factory used by the app and tests; hydrates journey from sessionStorage
 * unless a journey slice is supplied in `preloadedState`.
 * Subscribes so every state change persists the journey draft.
 */
export const createAppStore = (preloadedState?: Partial<RootState>) => {
  /** Prefer explicit preloaded journey; otherwise hydrate from sessionStorage. */
  const journey = preloadedState?.journey ?? loadJourneyState();
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...preloadedState,
      journey,
    },
    /** Redux DevTools only in Vite development builds. */
    devTools: import.meta.env.DEV,
  });

  /** Persist every change so a refresh resumes mid-journey. */
  store.subscribe(() => {
    saveJourneyState(store.getState().journey);
  });

  return store;
};

/** Singleton store for the running app (tests should call `createAppStore`). */
export const store = createAppStore();

/** Concrete store instance type from the factory return. */
export type AppStore = ReturnType<typeof createAppStore>;

/** Dispatch type for typed hooks and thunks. */
export type AppDispatch = AppStore['dispatch'];
