import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatMoneyExact } from '../../utils/formatMoney';
import { RecommendedLoanPanel } from './RecommendedLoanPanel';

const offer = {
  monthlyPayment: 7089.5,
  recommendedAmount: 150000,
  maxAmount: 180000,
  interestRate: 12.5,
  totalRepayment: 170148,
};

describe('RecommendedLoanPanel', () => {
  it('renders the monthly repayment hero and loan detail groups when an offer exists', () => {
    render(
      <RecommendedLoanPanel
        isEligible
        productLabel="Personal Loan"
        purposeLabel="Home improvement"
        requestedAmount={150000}
        loanTermMonths={24}
        loanFigures={offer}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Recommended loan' })).toBeInTheDocument();
    expect(
      screen.getByText('Estimated repayment for your requested loan.'),
    ).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(7089.5))).toBeInTheDocument();
    expect(screen.getByText('/ month')).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Home improvement')).toBeInTheDocument();
    expect(screen.getByText('Recommended amount')).toBeInTheDocument();
    expect(screen.getByText('Maximum amount based on your budget')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This budget maximum may leave little or no remaining monthly income/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('shows the requested-loan repayment estimate without a recommended offer when ineligible', () => {
    render(
      <RecommendedLoanPanel
        isEligible={false}
        productLabel="Personal Loan"
        purposeLabel="Home improvement"
        requestedAmount={150000}
        loanTermMonths={24}
        loanFigures={{
          ...offer,
          recommendedAmount: 0,
          maxAmount: 0,
        }}
      />,
    );

    expect(
      screen.getByText('Estimated repayment for your requested loan.'),
    ).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(7089.5))).toBeInTheDocument();
    expect(
      screen.getByText('No loan can be recommended based on this result.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Recommended amount')).not.toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Term')).toBeInTheDocument();
  });

  it('shows a clear message when no loan figures are available', () => {
    render(
      <RecommendedLoanPanel
        isEligible={false}
        productLabel="Personal Loan"
        purposeLabel="Home improvement"
        requestedAmount={150000}
        loanTermMonths={24}
        loanFigures={null}
      />,
    );

    expect(
      screen.getByText('No loan can be recommended based on this result.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Estimated repayment for your requested loan.'),
    ).not.toBeInTheDocument();
  });
});
