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
        offer={offer}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Recommended loan' })).toBeInTheDocument();
    expect(screen.getByText('Estimated monthly repayment')).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(7089.5))).toBeInTheDocument();
    expect(screen.getByText('/ month')).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Home improvement')).toBeInTheDocument();
    expect(screen.getByText('Recommended amount')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('shows a clear message instead of a zero offer when ineligible', () => {
    render(
      <RecommendedLoanPanel
        isEligible={false}
        productLabel="Personal Loan"
        purposeLabel="Home improvement"
        requestedAmount={150000}
        loanTermMonths={24}
        offer={null}
      />,
    );

    expect(
      screen.getByText('No loan can be recommended based on this result.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Estimated monthly repayment')).not.toBeInTheDocument();
    expect(screen.queryByText('Recommended amount')).not.toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Term')).toBeInTheDocument();
  });
});
