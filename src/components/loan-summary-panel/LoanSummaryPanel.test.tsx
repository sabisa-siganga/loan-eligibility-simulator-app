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

  it('shows error text and describes the button when error is set', () => {
    render(
      <LoanSummaryPanel
        productLabel="Personal Loan"
        purposeLabel="Education"
        amountLabel="R 20,000.00"
        termLabel="12 months"
        error="Select a loan purpose to continue."
        onAction={() => {}}
      />,
    );

    expect(screen.getByText('Select a loan purpose to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to your details' })).toHaveAttribute(
      'aria-describedby',
      'loan-summary-error',
    );
  });

  it('shows Continuing label and disables the button while submitting', () => {
    render(
      <LoanSummaryPanel
        productLabel="Personal Loan"
        purposeLabel="Education"
        amountLabel="R 20,000.00"
        termLabel="12 months"
        isSubmitting
        onAction={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Continuing…' })).toBeDisabled();
  });

  it('renders notice content and honors disabled without submitting', () => {
    render(
      <LoanSummaryPanel
        productLabel="Personal Loan"
        purposeLabel="Education"
        amountLabel="R 20,000.00"
        termLabel="12 months"
        notice={<p>Optional notice</p>}
        disabled
        onAction={() => {}}
      />,
    );

    expect(screen.getByText('Optional notice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to your details' })).toBeDisabled();
  });
});
