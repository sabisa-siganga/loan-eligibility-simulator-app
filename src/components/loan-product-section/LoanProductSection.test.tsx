import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_PRODUCTS } from '../../mocks/data/products';
import { LoanProductSection } from './LoanProductSection';

const personalLoan = MOCK_PRODUCTS[0];

const baseProps = {
  product: personalLoan,
  purposeGroupName: 'loan-purpose',
  selectedPurposeId: null as string | null,
  isExpanded: false,
  isSelected: false,
  amountText: '',
  termText: '',
  amountHelperText: 'R5 000 to R300 000',
  termHelperText: '6 to 60 months',
  onHeaderClick: vi.fn(),
  onPurposeChange: vi.fn(),
  onAmountChange: vi.fn(),
  onTermChange: vi.fn(),
  onAmountBlur: vi.fn(),
  onTermBlur: vi.fn(),
};

describe('LoanProductSection', () => {
  it('renders the product name and description when collapsed', () => {
    render(<LoanProductSection {...baseProps} />);

    expect(screen.getByRole('heading', { name: 'Personal Loan' })).toBeInTheDocument();
    expect(screen.getByText(personalLoan.description)).toBeInTheDocument();
    expect(screen.queryByLabelText('Home improvement')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();
  });

  it('notifies when the header is clicked', async () => {
    const user = userEvent.setup();
    const onHeaderClick = vi.fn();

    render(<LoanProductSection {...baseProps} onHeaderClick={onHeaderClick} />);

    await user.click(screen.getByRole('button', { name: 'Personal Loan' }));
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it('notifies when the description inside the header is clicked', async () => {
    const user = userEvent.setup();
    const onHeaderClick = vi.fn();

    render(<LoanProductSection {...baseProps} onHeaderClick={onHeaderClick} />);

    await user.click(screen.getByText(personalLoan.description));
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it('exposes expanded state on the header button', () => {
    const { rerender } = render(<LoanProductSection {...baseProps} isExpanded={false} />);

    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    rerender(<LoanProductSection {...baseProps} isExpanded />);
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('shows purpose cards when expanded and hides amount and term until selected', () => {
    render(<LoanProductSection {...baseProps} isExpanded />);

    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
    expect(screen.getByLabelText('Education')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Term/)).not.toBeInTheDocument();
  });

  it('shows amount and term when expanded and selected', () => {
    render(
      <LoanProductSection
        {...baseProps}
        isExpanded
        isSelected
        selectedPurposeId="education"
        amountText="150000"
        termText="24"
      />,
    );

    expect(screen.getByLabelText(/Required amount/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Term/)).toBeInTheDocument();
  });

  it('notifies when a purpose is selected', async () => {
    const user = userEvent.setup();
    const onPurposeChange = vi.fn();

    render(<LoanProductSection {...baseProps} isExpanded onPurposeChange={onPurposeChange} />);

    await user.click(screen.getByLabelText('Home improvement'));
    expect(onPurposeChange).toHaveBeenCalledWith('home_improvement');
  });

  it('shows field errors when the product is expanded and selected', () => {
    render(
      <LoanProductSection
        {...baseProps}
        isExpanded
        isSelected
        selectedPurposeId="education"
        amountText="100"
        termText="2"
        amountError="Amount too low"
        termError="Term too short"
        purposeError="Select a loan purpose to continue."
      />,
    );

    expect(screen.getByText('Amount too low')).toBeInTheDocument();
    expect(screen.getByText('Term too short')).toBeInTheDocument();
    expect(screen.getByText('Select a loan purpose to continue.')).toBeInTheDocument();
  });
});
