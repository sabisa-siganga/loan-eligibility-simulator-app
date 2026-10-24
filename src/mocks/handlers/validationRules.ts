import { http, HttpResponse } from 'msw';

import { MOCK_VALIDATION_RULES } from '../data/validationRules';

/**
 * Mock GET `/api/loans/validation-rules`.
 * Always succeeds with the static validation-rules payload.
 */
export const validationRulesHandlers = [
  http.get('*/api/loans/validation-rules', () => HttpResponse.json(MOCK_VALIDATION_RULES)),
];
