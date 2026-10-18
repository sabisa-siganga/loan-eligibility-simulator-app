import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../../mocks/data/validationRules';
import { server } from '../../mocks/server';
import { createAppStore, initialJourneyState, setCurrentScreen } from '../../store';
import { saveJourneyState } from '../../store/journeyPersistence';
import { renderWithProviders } from '../../test/renderWithProviders';
import { formatMoney } from '../../utils/formatMoney';
import { YourDetailsScreen } from './YourDetailsScreen';

const readyCatalog = {
  status: 'ready' as const,
  products: [...MOCK_PRODUCTS],
  validationRules: MOCK_VALIDATION_RULES,
  errorMessage: null,
};

const loanReadyJourney = {
  ...initialJourneyState,
  currentScreen: 'yourBudget' as const,
  selectedProductId: 'personal_loan',
  selectedPurpose: 'home_improvement',
  loanAmount: 150000,
  loanTerm: 24,
};

const renderScreen = (journey = loanReadyJourney) =>
  renderWithProviders(<YourDetailsScreen />, {
    preloadedState: {
      catalog: readyCatalog,
      journey,
    },
  });

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^Age/), '35');
  await user.selectOptions(screen.getByLabelText(/^Employment status/), 'employed');
  await user.type(screen.getByLabelText(/^Employment duration/), '24');
  await user.type(screen.getByLabelText(/^Monthly income/), '25000');
  await user.type(screen.getByLabelText(/^Monthly expenses/), '8000');
  await user.type(screen.getByLabelText(/^Existing debt/), '0');
};

describe('YourDetailsScreen', () => {
  it('renders personal and financial fields with credit consent and no contact fields', () => {
    renderScreen();

    expect(screen.getByRole('heading', { name: 'Your details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Monthly finances' })).toBeInTheDocument();
    expect(screen.getByLabelText('I consent to a credit bureau check')).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Simulated credit check scenario' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Good credit' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Poor credit' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'Good credit' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'Over limit' })).toBeEnabled();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone|cellphone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/repayment estimate/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Employment duration/)).not.toBeInTheDocument();
  });

  it('keeps demo scenario radios tabbable before credit consent', async () => {
    const user = userEvent.setup();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Age/)).toHaveFocus();
    });

    // Age → employment → income → expenses → debt → consent → first scenario chip
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    const poorChip = screen.getByText('Poor credit').closest('label');
    const goodChip = screen.getByText('Good credit').closest('label');
    const overLimitChip = screen.getByText('Over limit').closest('label');

    expect(poorChip).toHaveFocus();

    await user.tab();
    expect(goodChip).toHaveFocus();

    await user.tab();
    expect(overLimitChip).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(goodChip).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Good credit' })).toBeChecked();
  });

  it('focuses the age field on arrival instead of non-interactive titles', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Age/)).toHaveFocus();
    });

    const screenTitle = screen.getByRole('heading', { name: 'Your details' });
    const personalTitle = screen.getByRole('heading', { name: 'Personal details' });
    const financesTitle = screen.getByRole('heading', { name: 'Monthly finances' });

    expect(screenTitle).not.toHaveFocus();
    expect(personalTitle).not.toHaveFocus();
    expect(financesTitle).not.toHaveFocus();
    expect(screenTitle).not.toHaveAttribute('tabindex');
    expect(personalTitle).not.toHaveAttribute('tabindex');
    expect(financesTitle).not.toHaveAttribute('tabindex');
  });

  it('keeps Good credit selected by default and allows changing scenario before consent', async () => {
    const user = userEvent.setup();
    renderScreen();

    expect(screen.getByRole('radio', { name: 'Good credit' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Poor credit' }));

    expect(screen.getByRole('radio', { name: 'Poor credit' })).toBeChecked();
    expect(screen.getByLabelText('I consent to a credit bureau check')).not.toBeChecked();
  });

  it('shows helper captions for personal and financial fields', async () => {
    const user = userEvent.setup();
    renderScreen();

    const ageMin = MOCK_VALIDATION_RULES.personalInfo.age.min ?? 18;
    const ageMax = MOCK_VALIDATION_RULES.personalInfo.age.max ?? 60;
    const durationMin = MOCK_VALIDATION_RULES.personalInfo.employmentDuration.min ?? 3;
    const incomeMin = MOCK_VALIDATION_RULES.financialInfo.monthlyIncome.min ?? 5000;

    expect(screen.getByText(`Enter an age between ${ageMin} and ${ageMax}.`)).toBeInTheDocument();
    expect(
      screen.getByText('Select the option that best matches your situation.'),
    ).toBeInTheDocument();
    expect(screen.getByText(`Enter at least ${formatMoney(incomeMin)}.`)).toBeInTheDocument();
    expect(screen.getByText('Enter your typical monthly expenses in rand.')).toBeInTheDocument();
    expect(
      screen.getByText('Optional. Enter monthly debt repayments in rand, or leave blank.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Existing debt/)).not.toBeRequired();

    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'employed');
    expect(
      screen.getByText(`Enter at least ${durationMin} months for your employment status.`),
    ).toBeInTheDocument();
  });

  it('hides employment duration for unemployed and retired statuses', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'employed');
    expect(screen.getByLabelText(/^Employment duration/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'unemployed');
    expect(screen.queryByLabelText(/^Employment duration/)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'retired');
    expect(screen.queryByLabelText(/^Employment duration/)).not.toBeInTheDocument();
  });

  it('shows validation errors after submit and keeps the user on the screen', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    expect(await screen.findByText('Age must be between 18 and 65')).toBeInTheDocument();
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
  });

  it('focuses the first invalid field when check eligibility runs with empty fields', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    expect(await screen.findByText('Age must be between 18 and 65')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Age/)).toHaveFocus();
  });

  it('focuses employment status when age is valid and status is missing', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByLabelText(/^Age/), '35');
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    expect(await screen.findByText('Please select your employment status')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Employment status/)).toHaveFocus();
  });

  it('shows employment duration min error on blur before other fields are filled', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'employed');
    const duration = screen.getByLabelText(/^Employment duration/);
    await user.type(duration, '2');
    await user.tab();

    expect(await screen.findByText('Minimum 3 months employment required')).toBeInTheDocument();
  });

  it('blocks submit when employment duration is below the validation-rules minimum', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.type(screen.getByLabelText(/^Age/), '35');
    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'employed');
    await user.type(screen.getByLabelText(/^Employment duration/), '2');
    await user.type(screen.getByLabelText(/^Monthly income/), '25000');
    await user.type(screen.getByLabelText(/^Monthly expenses/), '8000');
    await user.type(screen.getByLabelText(/^Existing debt/), '0');
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    expect(await screen.findByText('Minimum 3 months employment required')).toBeInTheDocument();
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
  });

  it('blocks submit when employment duration is empty for employed and self_employed', async () => {
    const user = userEvent.setup();

    for (const employmentStatus of ['employed', 'self_employed'] as const) {
      const { store, unmount } = renderScreen();

      await user.type(screen.getByLabelText(/^Age/), '35');
      await user.selectOptions(screen.getByLabelText(/^Employment status/), employmentStatus);
      await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

      expect(await screen.findByText('Minimum 3 months employment required')).toBeInTheDocument();
      expect(store.getState().journey.currentScreen).toBe('yourBudget');
      unmount();
    }
  });

  it('checks eligibility and navigates to the result screen on success', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourResult');
    });
    expect(store.getState().journey.eligibilityResult).not.toBeNull();
  });

  it('allows check eligibility when existing debt is left blank and treats it as zero', async () => {
    const user = userEvent.setup();
    let requestedExistingDebt: number | undefined;
    server.use(
      http.post('*/api/loans/eligibility', async ({ request }) => {
        const body = (await request.json()) as {
          financialInfo?: { existingDebt?: number };
        };
        requestedExistingDebt = body.financialInfo?.existingDebt;
        return HttpResponse.json({
          eligibilityResult: {
            isEligible: true,
            approvalLikelihood: 80,
            riskCategory: 'low',
            decisionReason: 'ok',
          },
          recommendedLoan: {
            maxAmount: 150000,
            recommendedAmount: 150000,
            interestRate: 12.5,
            monthlyPayment: 5000,
            totalRepayment: 120000,
          },
          affordabilityAnalysis: {
            disposableIncome: 10000,
            debtToIncomeRatio: 20,
            loanToIncomeRatio: 60,
            affordabilityScore: 'good',
          },
        });
      }),
    );

    const { store } = renderScreen();

    await user.type(screen.getByLabelText(/^Age/), '35');
    await user.selectOptions(screen.getByLabelText(/^Employment status/), 'employed');
    await user.type(screen.getByLabelText(/^Employment duration/), '24');
    await user.type(screen.getByLabelText(/^Monthly income/), '25000');
    await user.type(screen.getByLabelText(/^Monthly expenses/), '8000');
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourResult');
    });
    expect(requestedExistingDebt).toBe(0);
    expect(store.getState().journey.eligibilityInputs?.existingDebt).toBe(0);
  });

  it('runs a credit check when consent is enabled before eligibility', async () => {
    const user = userEvent.setup();
    let creditCheckCalls = 0;
    let requestedState: string | null = null;
    server.use(
      http.post('*/api/loans/credit-check', async ({ request }) => {
        creditCheckCalls += 1;
        const body = (await request.json()) as { state?: string };
        requestedState = body.state ?? null;
        return HttpResponse.json({ creditScore: 720 });
      }),
    );

    const { store } = renderScreen();

    await fillValidForm(user);
    await user.click(screen.getByLabelText('I consent to a credit bureau check'));
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourResult');
    });
    expect(creditCheckCalls).toBe(1);
    expect(requestedState).toBe('good');
    expect(store.getState().journey.creditCheckScore).toBe(720);
  });

  it('sends the selected poor-credit scenario to the credit check endpoint', async () => {
    const user = userEvent.setup();
    let requestedState: string | null = null;
    server.use(
      http.post('*/api/loans/credit-check', async ({ request }) => {
        const body = (await request.json()) as { state?: string };
        requestedState = body.state ?? null;
        return HttpResponse.json({ creditScore: 520 });
      }),
    );

    const { store } = renderScreen();

    await fillValidForm(user);
    await user.click(screen.getByLabelText('I consent to a credit bureau check'));
    await user.click(screen.getByRole('radio', { name: 'Poor credit' }));
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourResult');
    });
    expect(requestedState).toBe('bad');
    expect(store.getState().journey.creditCheckState).toBe('bad');
    expect(store.getState().journey.creditCheckScore).toBe(520);
  });

  it('stays on the screen and shows an error when eligibility fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/loans/eligibility', () =>
        HttpResponse.json({ message: 'down' }, { status: 500 }),
      ),
    );

    const { store } = renderScreen();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    expect(
      await screen.findByText('Unable to check eligibility. Please try again.'),
    ).toBeInTheDocument();
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
    expect(store.getState().journey.personalDetails.age).toBe(35);
  });

  it('shows View result when an unchanged eligibility result is already stored', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen({
      ...loanReadyJourney,
      personalDetails: {
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      },
      financialDetails: {
        monthlyIncome: 25000,
        monthlyExpenses: 8000,
        existingDebt: 0,
      },
      eligibilityResult: {
        eligibilityResult: {
          isEligible: true,
          approvalLikelihood: 80,
          riskCategory: 'low',
          decisionReason: 'ok',
        },
        recommendedLoan: {
          maxAmount: 180000,
          recommendedAmount: 150000,
          interestRate: 12,
          monthlyPayment: 7000,
          totalRepayment: 168000,
        },
        affordabilityAnalysis: {
          disposableIncome: 10000,
          debtToIncomeRatio: 20,
          loanToIncomeRatio: 50,
          affordabilityScore: 'good',
        },
      },
      eligibilityInputs: {
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
        monthlyIncome: 25000,
        monthlyExpenses: 8000,
        existingDebt: 0,
        creditScore: null,
        requestedAmount: 150000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
        productId: 'personal_loan',
      },
    });

    expect(screen.getByRole('button', { name: 'View result' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View result' }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourResult');
    });
  });

  it('re-checks eligibility after returning from result and changing the credit scenario', async () => {
    const user = userEvent.setup();
    let creditCheckCalls = 0;
    let requestedStates: string[] = [];
    server.use(
      http.post('*/api/loans/credit-check', async ({ request }) => {
        creditCheckCalls += 1;
        const body = (await request.json()) as { state?: string };
        requestedStates = [...requestedStates, body.state ?? 'missing'];
        const score = body.state === 'bad' ? 520 : 720;
        return HttpResponse.json({ creditScore: score });
      }),
    );

    const { store, unmount } = renderScreen({
      ...loanReadyJourney,
      creditCheckOptIn: true,
      creditCheckState: 'good',
      creditCheckScore: 720,
      personalDetails: {
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      },
      financialDetails: {
        monthlyIncome: 25000,
        monthlyExpenses: 8000,
        existingDebt: 0,
      },
      eligibilityResult: {
        eligibilityResult: {
          isEligible: true,
          approvalLikelihood: 80,
          riskCategory: 'low',
          decisionReason: 'ok',
        },
        recommendedLoan: {
          maxAmount: 180000,
          recommendedAmount: 150000,
          interestRate: 12,
          monthlyPayment: 7000,
          totalRepayment: 168000,
        },
        affordabilityAnalysis: {
          disposableIncome: 10000,
          debtToIncomeRatio: 20,
          loanToIncomeRatio: 50,
          affordabilityScore: 'good',
        },
      },
      eligibilityInputs: {
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
        monthlyIncome: 25000,
        monthlyExpenses: 8000,
        existingDebt: 0,
        creditScore: 720,
        requestedAmount: 150000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
        productId: 'personal_loan',
      },
    });

    expect(screen.getByRole('button', { name: 'View result' })).toBeInTheDocument();

    // Simulate leaving for the result screen and coming back (App unmounts this screen).
    unmount();
    store.dispatch(setCurrentScreen('yourBudget'));
    renderWithProviders(<YourDetailsScreen />, { store });

    expect(screen.getByRole('button', { name: 'View result' })).toBeInTheDocument();
    expect(screen.getByLabelText('I consent to a credit bureau check')).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Poor credit' }));

    expect(screen.getByRole('button', { name: /Check eligibility/i })).toBeInTheDocument();
    expect(store.getState().journey.creditCheckScore).toBeNull();
    expect(store.getState().journey.eligibilityResult).toBeNull();

    await user.click(screen.getByRole('button', { name: /Check eligibility/i }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('yourResult');
    });
    expect(screen.queryByText(/credit check failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unable to check eligibility/i)).not.toBeInTheDocument();
    expect(creditCheckCalls).toBe(1);
    expect(requestedStates).toEqual(['bad']);
    expect(store.getState().journey.creditCheckScore).toBe(520);
    expect(store.getState().journey.eligibilityInputs?.creditScore).toBe(520);
  });

  it('preserves drafts when navigating back without validating', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.type(screen.getByLabelText(/^Age/), '40');
    await user.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(store.getState().journey.currentScreen).toBe('loanDetails');
    });
    expect(store.getState().journey.personalDetails.age).toBe(40);
  });

  it('restores budget draft fields and credit consent when the store hydrates from sessionStorage', () => {
    saveJourneyState({
      ...loanReadyJourney,
      creditCheckOptIn: true,
      creditCheckState: 'over_limit',
      personalDetails: {
        age: 42,
        employmentStatus: 'self_employed',
        employmentDuration: 36,
      },
      financialDetails: {
        monthlyIncome: 30000,
        monthlyExpenses: 9000,
        existingDebt: 1500,
      },
    });

    const store = createAppStore({
      catalog: readyCatalog,
    });

    renderWithProviders(<YourDetailsScreen />, { store });

    expect(store.getState().journey.currentScreen).toBe('yourBudget');
    expect(screen.getByLabelText(/^Age/)).toHaveValue('42');
    expect(screen.getByLabelText(/^Employment status/)).toHaveValue('self_employed');
    expect(screen.getByLabelText(/^Employment duration/)).toHaveValue('36');
    expect(screen.getByLabelText(/^Monthly income/)).toHaveValue('30 000.00');
    expect(screen.getByLabelText(/^Monthly expenses/)).toHaveValue('9 000.00');
    expect(screen.getByLabelText(/^Existing debt/)).toHaveValue('1 500.00');
    expect(screen.getByLabelText('I consent to a credit bureau check')).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Over limit' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Over limit' })).toBeEnabled();
  });
});
