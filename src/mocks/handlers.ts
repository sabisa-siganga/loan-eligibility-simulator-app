import type { RequestHandler } from 'msw';

import { calculateRateHandlers } from './handlers/calculateRate';
import { creditCheckHandlers } from './handlers/creditCheck';
import { eligibilityHandlers } from './handlers/eligibility';
import { productsHandlers } from './handlers/products';
import { validationRulesHandlers } from './handlers/validationRules';

/**
 * Browser + node Mock Service Worker handler list for the loan simulator endpoint surface.
 * Order is products → validation → credit check → rate → eligibility.
 */
export const handlers: RequestHandler[] = [
  ...productsHandlers,
  ...validationRulesHandlers,
  ...creditCheckHandlers,
  ...calculateRateHandlers,
  ...eligibilityHandlers,
];
