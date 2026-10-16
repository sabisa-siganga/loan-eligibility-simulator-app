import '@testing-library/jest-dom/vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';

expect.extend(axeMatchers);

import { resetCreditCheckCount } from '../mocks/handlers/creditCheck';
import { server } from '../mocks/server';
import { clearJourneyStorage } from '../store/journeyPersistence';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  resetCreditCheckCount();
  clearJourneyStorage();
});

afterAll(() => {
  server.close();
});
