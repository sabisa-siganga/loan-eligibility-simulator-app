import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LoanProduct, ValidationRulesResponse } from '../types/api';

/**
 * Boot-time catalog load lifecycle.
 * Journey screens render only when status is `ready`.
 */
export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Redux shape for products and validation rules loaded once before the journey.
 */
export type CatalogState = {
  status: CatalogStatus;
  products: LoanProduct[];
  validationRules: ValidationRulesResponse | null;
  errorMessage: string | null;
};

/** Default catalog before any fetch: idle, empty products, no rules or error. */
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
    /** Marks catalog fetch in progress and clears any previous error message. */
    catalogLoadStarted(state) {
      state.status = 'loading';
      state.errorMessage = null;
    },
    /**
     * Stores a successful products + validation-rules payload and marks ready.
     * Products are copied so the slice owns a mutable array.
     */
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
    /** Records a failed catalog fetch with the caller-supplied error message. */
    catalogLoadFailed(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.errorMessage = action.payload;
    },
  },
});

export const { catalogLoadStarted, catalogLoadSucceeded, catalogLoadFailed } = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;

/** Full catalog slice state. */
export const selectCatalog = (state: { catalog: CatalogState }): CatalogState => state.catalog;

/** Current catalog load status (`idle` | `loading` | `ready` | `error`). */
export const selectCatalogStatus = (state: { catalog: CatalogState }): CatalogStatus =>
  state.catalog.status;

/** Loaded loan products, or an empty array before a successful load. */
export const selectProducts = (state: { catalog: CatalogState }): LoanProduct[] =>
  state.catalog.products;

/** Loaded validation rules, or null until a successful catalog load. */
export const selectValidationRules = (state: {
  catalog: CatalogState;
}): ValidationRulesResponse | null => state.catalog.validationRules;
