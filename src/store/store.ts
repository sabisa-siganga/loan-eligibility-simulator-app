import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { catalogReducer } from './catalogSlice';
import { journeyReducer } from './journeySlice';

const rootReducer = combineReducers({
  catalog: catalogReducer,
  journey: journeyReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: import.meta.env.DEV,
  });

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
