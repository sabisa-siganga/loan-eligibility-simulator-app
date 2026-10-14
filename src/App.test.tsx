import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import App from './App';
import { server } from './mocks/server';
import { initialJourneyState } from './store';
import { renderWithProviders } from './test/renderWithProviders';

describe('App', () => {
  it('loads catalog data and shows Choose your loan', async () => {
    renderWithProviders(<App />);

    expect(screen.getByText('Loading loan products and validation rules…')).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Choose your loan' })).toBeInTheDocument();
    expect(screen.getByText('Loan Simulator')).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Finance')).toBeInTheDocument();
  });

  it('returns to Screen 1 when navigating back from the details stub', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />, {
      preloadedState: {
        catalog: {
          status: 'ready',
          products: [
            {
              id: 'personal_loan',
              name: 'Personal Loan',
              description: 'Flexible personal financing for various needs',
              minAmount: 5000,
              maxAmount: 300000,
              minTerm: 6,
              maxTerm: 60,
              interestRateRange: { min: 10.5, max: 18.5 },
              purposes: ['home_improvement'],
            },
          ],
          validationRules: {
            personalInfo: {
              age: { min: 18, max: 65, required: true },
              employmentStatus: {
                required: true,
                options: ['employed'],
              },
              employmentDuration: { min: 3, required: true },
            },
            financialInfo: {
              monthlyIncome: { min: 5000, required: true },
              monthlyExpenses: { min: 0, required: true },
              creditScore: { min: 300, max: 850, required: false },
            },
            loanDetails: {
              requestedAmount: { min: 5000, max: 300000, required: true },
              loanTerm: { min: 6, max: 60, required: true },
            },
          },
          errorMessage: null,
        },
        journey: {
          ...initialJourneyState,
          currentScreen: 'yourBudget',
          selectedProductId: 'personal_loan',
          selectedPurpose: 'home_improvement',
          loanAmount: 150000,
          loanTerm: 24,
        },
      },
    });

    expect(screen.getByRole('heading', { name: 'Your details' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to your loan' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Choose your loan' })).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
  });

  it('shows a retryable error when catalog loading fails', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/api/loans/products', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );

    renderWithProviders(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load loan products. Please try again.',
    );

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Choose your loan' })).toBeInTheDocument();
  });

  it('shows a retryable error when validation rules fail to load', async () => {
    server.use(
      http.get('*/api/loans/validation-rules', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );

    renderWithProviders(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load validation rules. Please try again.',
    );
  });

  it('shows a retryable error when the products list is empty', async () => {
    server.use(http.get('*/api/loans/products', () => HttpResponse.json({ products: [] })));

    renderWithProviders(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No loan products are available right now.',
    );
  });
});
