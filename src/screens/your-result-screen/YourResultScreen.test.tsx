import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_PRODUCTS } from '../../mocks/data/products';
import { MOCK_VALIDATION_RULES } from '../../mocks/data/validationRules';
import { createAppStore, initialJourneyState, type JourneyState } from '../../store';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { EligibilityResponse } from '../../types/api';
import { formatMoneyExact } from '../../utils/formatMoney';
import { YourResultScreen } from './YourResultScreen';

const readyCatalog = {
  status: 'ready' as const,
  products: [...MOCK_PRODUCTS],
  validationRules: MOCK_VALIDATION_RULES,
  errorMessage: null,
};

const endpointExampleResult: EligibilityResponse = {
  eligibilityResult: {
    isEligible: true,
    approvalLikelihood: 95,
    riskCategory: 'low',
    riskAssessmentStatus: 'assessed',
    decisionReason:
      'Your credit profile and available monthly income support the proposed repayment.',
  },
  recommendedLoan: {
    maxAmount: 180000,
    recommendedAmount: 150000,
    interestRate: 12.5,
    monthlyPayment: 7089.5,
    totalRepayment: 170148,
  },
  affordabilityAnalysis: {
    disposableIncome: 10000,
    debtToIncomeRatio: 20,
    loanToIncomeRatio: 60,
    affordabilityScore: 'good',
  },
};

const matchingInputs = {
  age: 35,
  employmentStatus: 'employed',
  employmentDuration: 24,
  monthlyIncome: 25000,
  monthlyExpenses: 15000,
  existingDebt: 5000,
  creditScore: 780,
  requestedAmount: 150000,
  loanTerm: 24,
  loanPurpose: 'home_improvement',
  productId: 'personal_loan',
};

const resultReadyJourney: JourneyState = {
  ...initialJourneyState,
  currentScreen: 'yourResult',
  selectedProductId: 'personal_loan',
  selectedPurpose: 'home_improvement',
  loanAmount: 150000,
  loanTerm: 24,
  manualCreditScore: 780,
  personalDetails: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
  financialDetails: {
    monthlyIncome: 25000,
    monthlyExpenses: 15000,
    existingDebt: 5000,
  },
  eligibilityResult: endpointExampleResult,
  eligibilityInputs: matchingInputs,
};

const renderScreen = (journey: JourneyState = resultReadyJourney) =>
  renderWithProviders(<YourResultScreen />, {
    preloadedState: {
      catalog: readyCatalog,
      journey,
    },
  });

describe('YourResultScreen', () => {
  it('renders the endpoint example as an eligible outcome with mapped fields', () => {
    renderScreen();

    expect(screen.getByRole('heading', { name: 'Your eligibility result' })).toBeInTheDocument();
    expect(screen.getByText('Review your outcome and recommended loan.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'You meet the initial eligibility criteria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your credit profile and available monthly income support the proposed repayment.',
      ),
    ).toBeInTheDocument();

    expect(screen.getAllByText(formatMoneyExact(7089.5)).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('/ month')).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Home improvement')).toBeInTheDocument();
    expect(screen.getAllByText(formatMoneyExact(150000)).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(formatMoneyExact(180000))).toBeInTheDocument();
    expect(screen.getByText('24 months')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(170148))).toBeInTheDocument();

    expect(screen.getByText('Monthly take-home income')).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(25000))).toBeInTheDocument();
    expect(screen.getByText('Existing monthly debt repayments')).toBeInTheDocument();
    expect(screen.getByText('Remaining monthly income')).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(10000))).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Budget composition: Monthly expenses ${formatMoneyExact(15000)}, Existing monthly debt repayments ${formatMoneyExact(5000)}, New repayment ${formatMoneyExact(7089.5)}, Remaining monthly income ${formatMoneyExact(10000)}`,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole('img', { name: 'Debt-to-income ratio: 20%' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Requested loan-to-annual-income ratio: 60%' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Maximum amount based on your budget')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Affordability rating: Good' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Simulated approval estimate: 95%' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This estimate uses mock rules for this simulator/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Overall risk')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(
      screen.getByText('Eligibility is an estimate. Final approval is subject to verification.'),
    ).toBeInTheDocument();
  });

  it('renders an ineligible outcome and keeps the requested-loan repayment estimate', () => {
    renderScreen({
      ...resultReadyJourney,
      eligibilityResult: {
        ...endpointExampleResult,
        eligibilityResult: {
          isEligible: false,
          approvalLikelihood: null,
          riskCategory: 'high',
          riskAssessmentStatus: 'assessed',
          decisionReason: 'Disposable income is insufficient after estimated repayments',
        },
        recommendedLoan: {
          maxAmount: 0,
          recommendedAmount: 0,
          interestRate: 12.5,
          monthlyPayment: 7089.5,
          totalRepayment: 170148,
        },
      },
    });

    expect(
      screen.getByRole('heading', { name: 'You do not meet the eligibility criteria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Disposable income is insufficient after estimated repayments'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No loan can be recommended based on this result.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Estimated repayment for your requested loan.')).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Simulated approval estimate: Not available' }),
    ).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows an assessment error without completed eligibility panels for invalid credit', () => {
    renderScreen({
      ...resultReadyJourney,
      eligibilityResult: {
        ...endpointExampleResult,
        eligibilityResult: {
          isEligible: false,
          approvalLikelihood: null,
          riskCategory: null,
          riskAssessmentStatus: 'invalid_credit_response',
          decisionReason:
            'Credit score must be between 300 and 850. Change the credit scenario or try again to complete your assessment.',
        },
        recommendedLoan: {
          maxAmount: 0,
          recommendedAmount: 0,
          interestRate: 12.5,
          monthlyPayment: 0,
          totalRepayment: 0,
        },
        affordabilityAnalysis: {
          disposableIncome: 0,
          debtToIncomeRatio: 0,
          loanToIncomeRatio: null,
          affordabilityScore: 'poor',
        },
      },
    });

    expect(
      screen.getByRole('heading', { name: 'We could not complete your assessment' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Change the credit scenario or try again/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recommended loan' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Affordability at a glance' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'You do not meet the eligibility criteria' }),
    ).not.toBeInTheDocument();
  });

  it('shows incomplete overall risk wording for missing credit without a misleading approval estimate', () => {
    renderScreen({
      ...resultReadyJourney,
      eligibilityResult: {
        ...endpointExampleResult,
        eligibilityResult: {
          isEligible: true,
          approvalLikelihood: null,
          riskCategory: null,
          riskAssessmentStatus: 'missing_credit_data',
          decisionReason:
            'You meet the initial eligibility criteria. Overall risk has not been fully assessed because credit information is unavailable.',
        },
      },
    });

    expect(screen.getByText('Not fully assessed')).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Simulated approval estimate: Not available' }),
    ).toBeInTheDocument();
  });

  it('shows a clear action when no eligibility result exists', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen({
      ...initialJourneyState,
      currentScreen: 'yourResult',
    });

    expect(screen.getByRole('heading', { name: 'No eligibility result yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to your details' }));
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
  });

  it('shows a distinct outdated state when inputs no longer match the stored result', () => {
    renderScreen({
      ...resultReadyJourney,
      loanAmount: 160000,
    });

    expect(screen.getByRole('heading', { name: 'Your result is out of date' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'You changed your details after your last check. Check your eligibility again to see an updated result.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'You meet the initial eligibility criteria' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'No eligibility result yet' }),
    ).not.toBeInTheDocument();
  });

  it('returns to your details from the outdated primary action', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen({
      ...resultReadyJourney,
      loanAmount: 160000,
    });

    await user.click(screen.getByRole('button', { name: 'Check eligibility again' }));
    expect(store.getState().journey.currentScreen).toBe('yourBudget');
  });

  it('displays ratios above 100 percent without replacing missing values with zero', () => {
    renderScreen({
      ...resultReadyJourney,
      eligibilityResult: {
        ...endpointExampleResult,
        affordabilityAnalysis: {
          ...endpointExampleResult.affordabilityAnalysis,
          debtToIncomeRatio: 120,
          loanToIncomeRatio: 105,
        },
      },
    });

    expect(screen.getByRole('img', { name: 'Debt-to-income ratio: 120%' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Requested loan-to-annual-income ratio: 105%' }),
    ).toBeInTheDocument();
  });

  it('shows Not available when loan-to-income ratio is null', () => {
    renderScreen({
      ...resultReadyJourney,
      eligibilityResult: {
        ...endpointExampleResult,
        affordabilityAnalysis: {
          ...endpointExampleResult.affordabilityAnalysis,
          loanToIncomeRatio: null,
        },
      },
    });

    expect(
      screen.getByRole('status', {
        name: 'Requested loan-to-annual-income ratio: Not available',
      }),
    ).toBeInTheDocument();
  });

  it('returns to your details on Back without clearing the current result', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(store.getState().journey.currentScreen).toBe('yourBudget');
    expect(store.getState().journey.eligibilityResult).not.toBeNull();
  });

  it('clears journey-specific state and returns to screen one on Start again', async () => {
    const user = userEvent.setup();
    const { store } = renderScreen();

    await user.click(screen.getByRole('button', { name: 'Start again' }));

    const state = store.getState();
    expect(state.journey.currentScreen).toBe('loanDetails');
    expect(state.journey.eligibilityResult).toBeNull();
    expect(state.journey.eligibilityInputs).toBeNull();
    expect(state.journey.selectedProductId).toBeNull();
    expect(state.journey.loanAmount).toBeNull();
    expect(state.catalog.products).toHaveLength(MOCK_PRODUCTS.length);
  });

  it('preserves a valid zero disposable income value', () => {
    renderScreen({
      ...resultReadyJourney,
      eligibilityResult: {
        ...endpointExampleResult,
        affordabilityAnalysis: {
          ...endpointExampleResult.affordabilityAnalysis,
          disposableIncome: 0,
        },
      },
    });

    expect(screen.getByText(formatMoneyExact(0))).toBeInTheDocument();
  });
});

describe('YourResultScreen store wiring', () => {
  it('does not auto-submit eligibility when the screen mounts', () => {
    const store = createAppStore({
      catalog: readyCatalog,
      journey: resultReadyJourney,
    });
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    renderWithProviders(<YourResultScreen />, { store });

    const eligibilityActions = dispatchSpy.mock.calls.filter(([action]) => {
      if (typeof action !== 'object' || action === null || !('type' in action)) {
        return false;
      }
      return (
        String(action.type).includes('eligibility') || String(action.type).includes('Eligibility')
      );
    });
    expect(eligibilityActions).toHaveLength(0);
  });
});
