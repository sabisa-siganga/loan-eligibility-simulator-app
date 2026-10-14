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

const expandProduct = async (
  user: ReturnType<typeof userEvent.setup>,
  productName: string,
) => {
  await user.click(screen.getByRole('button', { name: productName }));
};

describe('LoanDetailsScreen', () => {
  it('keeps products collapsed until a header is clicked', () => {
    renderScreen();

    expect(screen.queryByLabelText('Home improvement')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('expands one product at a time and reveals purposes', async () => {
    const user = userEvent.setup();
    renderScreen();

    await expandProduct(user, 'Personal Loan');
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

    await expandProduct(user, 'Personal Loan');
    expect(screen.queryByLabelText(/Required amount/)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Home improvement'));
    expect(activeAmount()).toBeInTheDocument();
    expect(activeTerm()).toBeInTheDocument();
  });

  it('allows exactly one purpose across products and selects the parent product', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await expandProduct(user, 'Personal Loan');
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

    await expandProduct(user, 'Personal Loan');
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

  it('expands the first product and shows a purpose error when calculate runs with nothing selected', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    expect(await screen.findByText('Select a loan purpose to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Home improvement')).toBeInTheDocument();
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

    await expandProduct(user, 'Personal Loan');
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

    await expandProduct(user, 'Personal Loan');
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

    await expandProduct(user, 'Personal Loan');
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
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

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

    await expandProduct(user, 'Personal Loan');
    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '20000');
    await user.type(activeTerm(), '12');
    await user.type(screen.getByLabelText('Your credit score'), '100');
    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    expect(
      await screen.findByText('Credit score must be between 300 and 850'),
    ).toBeInTheDocument();
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

  it('continues to your details without recalculating when the quote matches', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen({
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

    await user.click(screen.getByRole('button', { name: 'Continue to your details' }));
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
  });

  it('shows a credit-check error when the request fails', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/loans/credit-check', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );

    renderScreen();
    await user.click(screen.getByRole('button', { name: 'Run a credit check' }));

    expect(
      await screen.findByText(
        'Credit check failed. You can try again or continue without a score.',
      ),
    ).toBeInTheDocument();
  });

  it('validates amount on blur after interaction', async () => {
    const user = userEvent.setup();
    renderScreen();

    await expandProduct(user, 'Personal Loan');
    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '100');
    await user.tab();

    expect(
      await screen.findByText(/Loan amount must be between/),
    ).toBeInTheDocument();
  });

  it('shows a purpose error under the expanded product after a failed submit', async () => {
    const user = userEvent.setup();
    renderScreen({
      ...initialJourneyState,
      selectedProductId: 'personal_loan',
      selectedPurpose: null,
    });

    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    expect(await screen.findByText('Select a loan purpose to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal Loan' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('uses the credit-check score when the manual field is empty', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;

    server.use(
      http.post('*/api/loans/calculate-rate', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({
          interestRate: 12,
          monthlyPayment: 100,
          totalInterest: 200,
          totalRepayment: 2400,
          paymentSchedule: [],
        });
      }),
    );

    const { store } = renderScreen({
      ...initialJourneyState,
      creditCheckScore: 680,
    });

    await expandProduct(user, 'Personal Loan');
    await user.click(screen.getByLabelText('Education'));
    await user.type(activeAmount(), '20000');
    await user.type(activeTerm(), '12');
    await user.click(screen.getByRole('button', { name: 'Calculate repayment' }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourBudget');
    });
    expect(requestBody).toMatchObject({ creditScore: 680 });
  });
});
