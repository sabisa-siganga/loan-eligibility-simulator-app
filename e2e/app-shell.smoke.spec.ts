import { expect, test } from '@playwright/test';

import { openLoanDetails } from './helpers/journey';

test('shows the Loan Eligibility Simulator foundation shell', async ({ page }) => {
  await openLoanDetails(page);

  await expect(page.getByRole('heading', { name: 'Loan Eligibility Simulator' })).toBeVisible();
  await expect(page.getByTestId('current-screen')).toHaveText('Current screen: Loan details');
  await expect(page.getByRole('button', { name: 'Start again' })).toBeVisible();
});
