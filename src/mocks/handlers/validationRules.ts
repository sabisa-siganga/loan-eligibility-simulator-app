import { http, HttpResponse } from 'msw';

import { MOCK_VALIDATION_RULES } from '../data/validationRules';

export const validationRulesHandlers = [
  http.get('*/api/loans/validation-rules', () => HttpResponse.json(MOCK_VALIDATION_RULES)),
];
