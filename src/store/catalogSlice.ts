import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LoanProduct, ValidationRulesResponse } from '../types/api';

/**
 * Boot-time catalog: products + validation rules loaded once before the journey.
 * Journey screens render only when status is `ready`.
 */
export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

export type CatalogState = {
  status: CatalogStatus;
  products: LoanProduct[];
  validationRules: ValidationRulesResponse | null;
  errorMessage: string | null;
};

const initialState: CatalogState = {
  status: 'idle',
  products: [],
  validationRules: null,
  errorMessage: null,
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    catalogLoadStarted(state) {
      state.status = 'loading';
      state.errorMessage = null;
    },
    catalogLoadSucceeded(
      state,
      action: PayloadAction<{
        products: readonly LoanProduct[];
        validationRules: ValidationRulesResponse;
      }>,
    ) {
      state.status = 'ready';
      state.products = [...action.payload.products];
      state.validationRules = action.payload.validationRules;
      state.errorMessage = null;
    },
    catalogLoadFailed(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.errorMessage = action.payload;
    },
  },
});

export const { catalogLoadStarted, catalogLoadSucceeded, catalogLoadFailed } = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;

export const selectCatalog = (state: { catalog: CatalogState }): CatalogState => state.catalog;
export const selectCatalogStatus = (state: { catalog: CatalogState }): CatalogStatus =>
  state.catalog.status;
export const selectProducts = (state: { catalog: CatalogState }): LoanProduct[] =>
  state.catalog.products;
export const selectValidationRules = (state: {
  catalog: CatalogState;
}): ValidationRulesResponse | null => state.catalog.validationRules;
