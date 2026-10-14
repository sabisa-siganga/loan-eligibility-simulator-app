import { expect, test } from '@playwright/test';

import { openLoanDetails } from './helpers/journey';

test('shows Choose your loan after catalog load', async ({ page }) => {
  await openLoanDetails(page);

  await expect(page.getByText('Loan Simulator')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose your loan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to your details' })).toBeVisible();
});
