import type { Page } from '@playwright/test';

/**
 * Shared journey helpers. Full fill/mock behaviour lands with screen work;
 * these stubs open the foundation shell for smoke coverage today.
 */
export const openLoanDetails = async (page: Page) => {
  await page.goto('/');
  await page.getByTestId('current-screen').waitFor();
};

export const continueToBudgetWithPurpose = async (page: Page, purpose = ''): Promise<never> => {
  void page;
  void purpose;
  throw new Error('continueToBudgetWithPurpose requires loan screens — not implemented yet.');
};

export const fillEmployedBudgetThatPasses = async (page: Page): Promise<never> => {
  void page;
  throw new Error('fillEmployedBudgetThatPasses requires budget screens — not implemented yet.');
};

/** Storage key reserved for mock eligibility failure (owned by src/mocks when added). */
export const MOCK_ELIGIBILITY_FAIL_STORAGE_KEY = 'les.mock.eligibilityFail';

export const enableEligibilityFailureMock = async (page: Page) => {
  await page.addInitScript((storageKey: string) => {
    sessionStorage.setItem(storageKey, 'true');
  }, MOCK_ELIGIBILITY_FAIL_STORAGE_KEY);
};
