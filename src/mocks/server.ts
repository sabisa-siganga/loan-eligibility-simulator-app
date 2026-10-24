import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/**
 * Mock Service Worker server for Node (Vitest).
 * Same handler list as the browser worker so unit/integration tests hit the mock endpoint.
 */
export const server = setupServer(...handlers);
