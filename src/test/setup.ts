import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

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
