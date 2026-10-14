import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import { initialJourneyState } from './store';
import { renderWithProviders } from './test/renderWithProviders';

describe('App shell', () => {
  it('renders the Loan Eligibility Simulator app shell on Loan details', () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('heading', { name: 'Loan Eligibility Simulator' })).toBeInTheDocument();
    expect(screen.getByTestId('current-screen')).toHaveTextContent('Current screen: Loan details');
  });

  it('returns to Loan details when Start again resets the journey', async () => {
    const user = userEvent.setup();

    const { store } = renderWithProviders(<App />, {
      preloadedState: {
        journey: {
          ...initialJourneyState,
          currentScreen: 'yourResult',
        },
      },
    });

    expect(screen.getByTestId('current-screen')).toHaveTextContent('Current screen: Your result');
    expect(store.getState().journey.currentScreen).toBe('yourResult');

    await user.click(screen.getByRole('button', { name: 'Start again' }));

    expect(screen.getByTestId('current-screen')).toHaveTextContent('Current screen: Loan details');
    expect(store.getState().journey.currentScreen).toBe('loanDetails');
  });
});
