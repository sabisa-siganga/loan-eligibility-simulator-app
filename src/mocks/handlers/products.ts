import { http, HttpResponse } from 'msw';

import { MOCK_PRODUCTS } from '../data/products';

/**
 * Mock GET `/api/loans/products`.
 * Always succeeds with the static catalog wrapped as `{ products }`.
 */
export const productsHandlers = [
  http.get('*/api/loans/products', () =>
    HttpResponse.json({
      products: MOCK_PRODUCTS,
    }),
  ),
];
