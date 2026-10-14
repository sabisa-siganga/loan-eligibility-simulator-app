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
  isSelected: false,
  amountText: '',
  termText: '',
  amountHelperText: 'R5,000 to R300,000',
  termHelperText: '6 to 60 months',
  onPurposeChange: vi.fn(),
  onAmountChange: vi.fn(),
  onTermChange: vi.fn(),
  onAmountBlur: vi.fn(),
  onTermBlur: vi.fn(),
};

describe('LoanProductSection', () => {
  it('renders the product name, description, and purpose cards', () => {
    render(<LoanProductSection {...baseProps} />);

    expect(screen.getByRole('heading', { name: 'Personal Loan' })).toBeInTheDocument();
    expect(screen.getByText(personalLoan.description)).toBeInTheDocument();
    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
    expect(screen.getByLabelText('Education')).toBeInTheDocument();
  });

  it('notifies when a purpose is selected', async () => {
    const user = userEvent.setup();
    const onPurposeChange = vi.fn();

    render(<LoanProductSection {...baseProps} onPurposeChange={onPurposeChange} />);

    await user.click(screen.getByLabelText('Home improvement'));
    expect(onPurposeChange).toHaveBeenCalledWith('home_improvement');
  });

  it('disables amount and term when the product is not selected', () => {
    render(<LoanProductSection {...baseProps} isSelected={false} />);

    expect(screen.getByLabelText(/Required amount/)).toBeDisabled();
    expect(screen.getByLabelText(/^Term/)).toBeDisabled();
  });

  it('shows field errors when the product is selected', () => {
    render(
      <LoanProductSection
        {...baseProps}
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
