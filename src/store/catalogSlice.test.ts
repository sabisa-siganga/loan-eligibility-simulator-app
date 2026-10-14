import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../mocks/data/validationRules';
import {
  catalogLoadFailed,
  catalogLoadStarted,
  catalogLoadSucceeded,
  catalogReducer,
  type CatalogState,
} from './catalogSlice';

describe('catalogSlice', () => {
  const initial: CatalogState = {
    status: 'idle',
    products: [],
    validationRules: null,
    errorMessage: null,
  };

  it('moves to loading on catalogLoadStarted', () => {
    const next = catalogReducer(initial, catalogLoadStarted());
    expect(next.status).toBe('loading');
    expect(next.errorMessage).toBeNull();
  });

  it('stores products and rules on success', () => {
    const next = catalogReducer(
      catalogReducer(initial, catalogLoadStarted()),
      catalogLoadSucceeded({
        products: MOCK_PRODUCTS,
        validationRules: MOCK_VALIDATION_RULES,
      }),
    );

    expect(next.status).toBe('ready');
    expect(next.products).toHaveLength(2);
    expect(next.validationRules).toEqual(MOCK_VALIDATION_RULES);
  });

  it('stores an error message on failure', () => {
    const next = catalogReducer(initial, catalogLoadFailed('Unable to load'));
    expect(next.status).toBe('error');
    expect(next.errorMessage).toBe('Unable to load');
  });
});
