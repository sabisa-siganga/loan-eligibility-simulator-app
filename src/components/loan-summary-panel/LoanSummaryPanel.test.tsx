import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoanSummaryPanel } from './LoanSummaryPanel';

describe('LoanSummaryPanel', () => {
  it('shows product purpose amount and term without a credit score row', () => {
    render(
      <LoanSummaryPanel
        productLabel="Personal Loan"
        purposeLabel="Education"
        amountLabel="R 20,000.00"
        termLabel="12 months"
        onAction={() => {}}
      />,
    );

    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('R 20,000.00')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.queryByText('Credit score')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to your details' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Calculate repayment' })).not.toBeInTheDocument();
  });

  it('invokes onAction when Continue is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <LoanSummaryPanel
        productLabel="Personal Loan"
        purposeLabel="Education"
        amountLabel="R 20,000.00"
        termLabel="12 months"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
