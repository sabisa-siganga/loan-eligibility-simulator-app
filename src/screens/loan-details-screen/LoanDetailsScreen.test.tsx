import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../../mocks/data/validationRules';
import { server } from '../../mocks/server';
import { initialJourneyState } from '../../store';
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

describe('LoanDetailsScreen', () => {
  it('allows exactly one purpose across products and selects the parent product', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByLabelText('Home improvement'));
    expect(store.getState().journey.selectedProductId).toBe('personal_loan');
    expect(store.getState().journey.selectedPurpose).toBe('home_improvement');

    await user.click(screen.getByLabelText('New vehicle'));
    expect(store.getState().journey.selectedProductId).toBe('vehicle_loan');
    expect(store.getState().journey.selectedPurpose).toBe('new_vehicle');
    expect(screen.getByLabelText('Home improvement')).not.toBeChecked();
    expect(screen.getByLabelText('New vehicle')).toBeChecked();
  });

  it('clears amount and term when the selected product changes', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '20000');
    await user.type(activeTerm(), '12');

    expect(store.getState().journey.loanAmount).toBe(20000);
    expect(store.getState().journey.loanTerm).toBe(12);

    await user.click(screen.getByLabelText('Used vehicle'));

    expect(store.getState().journey.loanAmount).toBeNull();
    expect(store.getState().journey.loanTerm).toBeNull();
    expect(activeAmount()).toHaveValue('');
    expect(activeTerm()).toHaveValue('');
  });

  it('starts with empty amount and term fields', () => {
    renderScreen();
    const amountInputs = screen.getAllByLabelText(/Required amount/);
    const termInputs = screen.getAllByLabelText(/^Term/);
    amountInputs.forEach((input) => {
      expect(input).toHaveValue('');
    });
    termInputs.forEach((input) => {
      expect(input).toHaveValue('');
    });
  });

  it('validates the active loan on calculate and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    expect(await screen.findByText('Select a loan purpose to continue.')).toBeInTheDocument();
  });

  it('omits creditScore from calculate-rate when no score is available', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;

    server.use(
      http.post('*/api/loans/calculate-rate', async ({ request }) => {
        requestBody = await request.json();
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

    await user.click(screen.getByLabelText('Medical'));
    await user.type(activeAmount(), '25000');
    await user.type(activeTerm(), '18');
    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourBudget');
    });
    expect(requestBody).toEqual({
      loanAmount: 25000,
      loanTerm: 18,
      loanType: 'personal_loan',
    });
  });

  it('uses a manually entered credit score and navigates after success', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;

    server.use(
      http.post('*/api/loans/calculate-rate', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({
          interestRate: 11,
          monthlyPayment: 100,
          totalInterest: 200,
          totalRepayment: 2400,
          paymentSchedule: [],
        });
      }),
    );

    const { store } = renderScreen();

    await user.click(screen.getByLabelText('Other'));
    await user.type(activeAmount(), '30000');
    await user.type(activeTerm(), '24');
    await user.type(screen.getByLabelText('Your credit score'), '720');
    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourBudget');
    });
    expect(requestBody).toMatchObject({ creditScore: 720 });
  });

  it('keeps entries and shows an error when calculation fails', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/loans/calculate-rate', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );

    const { store } = renderScreen();

    await user.click(screen.getByLabelText('Home improvement'));
    await user.type(activeAmount(), '40000');
    await user.type(activeTerm(), '36');
    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    expect(
      await screen.findByText('Unable to calculate repayment. Please try again.'),
    ).toBeInTheDocument();
    expect(store.getState().journey.currentScreen).toBe('loanDetails');
    expect(activeAmount()).toHaveValue('40000');
  });

  it('shows Continue to your details when the stored quote still matches', async () => {
    const user = userEvent.setup();
    renderScreen({
      ...initialJourneyState,
      selectedProductId: 'personal_loan',
      selectedPurpose: 'education',
      loanAmount: 50000,
      loanTerm: 24,
      rateQuote: {
        interestRate: 12,
        monthlyPayment: 100,
        totalInterest: 200,
        totalRepayment: 2400,
        paymentSchedule: [],
      },
      rateQuoteInputs: {
        loanType: 'personal_loan',
        loanAmount: 50000,
        loanTerm: 24,
        creditScore: null,
      },
    });

    const summary = screen.getByRole('complementary', { name: 'Your loan summary' });
    expect(
      within(summary).getByRole('button', { name: 'Continue to your details' }),
    ).toBeInTheDocument();

    await user.type(activeAmount(), '1');
    expect(
      within(summary).getByRole('button', { name: 'Recalculate repayment' }),
    ).toBeInTheDocument();
  });

  it('runs a credit check on demand and preserves the manual score', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.type(screen.getByLabelText('Your credit score'), '700');
    await user.click(screen.getByRole('button', { name: 'Run a credit check' }));

    await waitFor(() => {
      expect(store.getState().journey.creditCheckScore).not.toBeNull();
    });
    expect(store.getState().journey.manualCreditScore).toBe(700);
    expect(screen.getByText(/Using your entered score of 700/)).toBeInTheDocument();
  });

  it('blocks calculation when a supplied manual credit score is invalid', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '20000');
    await user.type(activeTerm(), '12');
    await user.type(screen.getByLabelText('Your credit score'), '100');
    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    expect(
      await screen.findByText('Credit score must be between 300 and 850'),
    ).toBeInTheDocument();
  });
});
