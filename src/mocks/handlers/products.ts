import { http, HttpResponse } from 'msw';

import { MOCK_PRODUCTS } from '../data/products';

export const productsHandlers = [
  http.get('*/api/loans/products', () =>
    HttpResponse.json({
      products: MOCK_PRODUCTS,
    }),
  ),
];
