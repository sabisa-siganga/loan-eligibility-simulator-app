import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/**
 * Mock Service Worker service-worker instance for browser/dev.
 * Spreads the shared handler list so the SPA can intercept endpoint calls.
 */
export const worker = setupWorker(...handlers);
