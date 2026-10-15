import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../../mocks/data/validationRules';
import { server } from '../../mocks/server';
import { createAppStore, initialJourneyState } from '../../store';
import { saveJourneyState } from '../../store/journeyPersistence';
import { renderWithProviders } from '../../test/renderWithProviders';
import { LoanDetailsScreen } from './LoanDetailsScreen';

const readyCatalog = {
  status: 'ready' as const,
  products: [...MOCK_PRODUCTS],
  validationRules: MOCK_VALIDATION_RULES,
  errorMessage: null,
};

const renderScreen = (journey = initialJourneyState) =>
  renderWithProviders(<LoanDetailsScreen />, {
    preloadedState: {
      catalog: readyCatalog,
      journey,
    },
  });

const activeAmount = () => document.getElementById('loan-amount') as HTMLInputElement;
const activeTerm = () => document.getElementById('loan-term') as HTMLInputElement;

const expandProduct = async (user: ReturnType<typeof userEvent.setup>, productName: string) => {
  await user.click(screen.getByRole('button', { name: productName }));
};

describe('LoanDetailsScreen', () => {
  it('opens the first loan product by default and keeps others collapsed', () => {
    renderScreen();

    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vehicle Finance' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByLabelText('New vehicle')).not.toBeInTheDocument();
  });

  it('expands one product at a time and reveals purposes', async () => {
    const user = userEvent.setup();
    renderScreen();

    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
    expect(screen.queryByLabelText('New vehicle')).not.toBeInTheDocument();

    await expandProduct(user, 'Vehicle Finance');
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Vehicle Finance' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.queryByLabelText('Home improvement')).not.toBeInTheDocument();
    expect(screen.getByLabelText('New vehicle')).toBeInTheDocument();
  });

  it('does not collapse the open product when its header is clicked again', async () => {
    const user = userEvent.setup();
    renderScreen();

    await expandProduct(user, 'Personal Loan');

    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
  });

  it('shows amount and term only after a purpose is selected', async () => {
    const user = userEvent.setup();
    renderScreen();

    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Home improvement'));
    expect(activeAmount()).toBeInTheDocument();
    expect(activeTerm()).toBeInTheDocument();
  });

  it('allows exactly one purpose across products and selects the parent product', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByLabelText('Home improvement'));
    expect(store.getState().journey.selectedProductId).toBe('personal_loan');
    expect(store.getState().journey.selectedPurpose).toBe('home_improvement');

    await expandProduct(user, 'Vehicle Finance');
    expect(store.getState().journey.selectedProductId).toBeNull();
    expect(store.getState().journey.selectedPurpose).toBeNull();

    await user.click(screen.getByLabelText('New vehicle'));
    expect(store.getState().journey.selectedProductId).toBe('vehicle_loan');
    expect(store.getState().journey.selectedPurpose).toBe('new_vehicle');
    expect(screen.getByLabelText('New vehicle')).toBeChecked();
  });

  it('clears amount and term when switching to another product accordion', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '20000');
    await user.type(activeTerm(), '12');

    expect(store.getState().journey.loanAmount).toBe(20000);
    expect(store.getState().journey.loanTerm).toBe(12);

    await expandProduct(user, 'Vehicle Finance');

    expect(store.getState().journey.loanAmount).toBeNull();
    expect(store.getState().journey.loanTerm).toBeNull();
    expect(store.getState().journey.selectedPurpose).toBeNull();
    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();
  });

  it('keeps the first product open and shows a purpose error when continue runs with nothing selected', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));

    expect(await screen.findByText('Select a loan purpose to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
  });
  it('continues to your details without calling credit-check or calculate-rate', async () => {
    const user = userEvent.setup();
    let creditCheckCalls = 0;
    let calculateCalls = 0;

    server.use(
      http.post('*/api/loans/credit-check', () => {
        creditCheckCalls += 1;
        return HttpResponse.json({ creditScore: 620 });
      }),
      http.post('*/api/loans/calculate-rate', () => {
        calculateCalls += 1;
        return HttpResponse.json({
          interestRate: 14.5,
          monthlyPayment: 100,
          totalInterest: 200,
          totalRepayment: 2400,
          paymentSchedule: [],
        });
      }),
    );

    const { store } = renderScreen();

    await expandProduct(user, 'Personal Loan');
    await user.click(screen.getByLabelText('Medical'));
    await user.type(activeAmount(), '25000');
    await user.type(activeTerm(), '18');
    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourBudget');
    });
    expect(creditCheckCalls).toBe(0);
    expect(calculateCalls).toBe(0);
    expect(screen.queryByText('Credit score')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Your credit score')).not.toBeInTheDocument();
  });

  it('blocks continue when loan fields are invalid', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await expandProduct(user, 'Personal Loan');
    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '100');
    await user.type(activeTerm(), '12');
    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));

    expect(await screen.findByText(/Loan amount must be between/)).toBeInTheDocument();
    expect(store.getState().journey.currentScreen).toBe('loanDetails');
  });

  it('shows an empty-products message when the catalog has no products', () => {
    renderWithProviders(<LoanDetailsScreen />, {
      preloadedState: {
        catalog: {
          ...readyCatalog,
          products: [],
        },
        journey: initialJourneyState,
      },
    });

    expect(screen.getByText('No loan products are available right now.')).toBeInTheDocument();
  });

  it('renders nothing when validation rules are missing', () => {
    const { container } = renderWithProviders(<LoanDetailsScreen />, {
      preloadedState: {
        catalog: {
          ...readyCatalog,
          validationRules: null,
        },
        journey: initialJourneyState,
      },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('focuses the term field when continue runs with an invalid term', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '20000');
    await user.type(activeTerm(), '2');
    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));

    expect(await screen.findByText(/Loan term must be between/)).toBeInTheDocument();
    expect(activeTerm()).toHaveFocus();
  });

  it('validates amount on blur after interaction', async () => {
    const user = userEvent.setup();
    renderScreen();

    await expandProduct(user, 'Personal Loan');
    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '100');
    await user.tab();

    expect(await screen.findByText(/Loan amount must be between/)).toBeInTheDocument();
  });

  it('shows a purpose error under the expanded product after a failed submit', async () => {
    const user = userEvent.setup();
    renderScreen({
      ...initialJourneyState,
      selectedProductId: 'personal_loan',
      selectedPurpose: null,
    });

    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));

    expect(await screen.findByText('Select a loan purpose to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Debt consolidation')).toHaveFocus();
  });

  it('restores loan draft fields when the store hydrates from sessionStorage', () => {
    saveJourneyState({
      ...initialJourneyState,
      selectedProductId: 'personal_loan',
      selectedPurpose: 'education',
      loanAmount: 20000,
      loanTerm: 12,
    });

    const store = createAppStore({
      catalog: readyCatalog,
    });

    renderWithProviders(<LoanDetailsScreen />, { store });

    expect(screen.getByLabelText('Education')).toBeChecked();
    expect(activeAmount()).toHaveValue('20000');
    expect(activeTerm()).toHaveValue('12');
    expect(screen.getByText('R20 000')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
  });
});
