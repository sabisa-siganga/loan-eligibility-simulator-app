import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EligibilityOutcomeBanner } from './EligibilityOutcomeBanner';

describe('EligibilityOutcomeBanner', () => {
  it('renders the eligible outcome heading and decision reason', () => {
    render(
      <EligibilityOutcomeBanner
        isEligible
        decisionReason="Your credit profile and available monthly income support the proposed repayment."
        tone="success"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'You meet the initial eligibility criteria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your credit profile and available monthly income support the proposed repayment.',
      ),
    ).toBeInTheDocument();
  });

  it('renders a neutral eligible banner when tone is neutral', () => {
    render(
      <EligibilityOutcomeBanner
        isEligible
        decisionReason="Overall risk has not been fully assessed because credit information is unavailable."
        tone="neutral"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'You meet the initial eligibility criteria' }),
    ).toBeInTheDocument();
  });

  it('renders the ineligible outcome heading and decision reason', () => {
    render(
      <EligibilityOutcomeBanner
        isEligible={false}
        decisionReason="Disposable income is insufficient after estimated repayments"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'You do not meet the eligibility criteria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Disposable income is insufficient after estimated repayments'),
    ).toBeInTheDocument();
  });

  it('renders an assessment-error heading that is not an eligibility decline', () => {
    render(
      <EligibilityOutcomeBanner
        isEligible={false}
        outcomeKind="assessment_error"
        tone="unsuccessful"
        decisionReason="Credit score must be between 300 and 850. Change the credit scenario or try again to complete your assessment."
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'We could not complete your assessment' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'You do not meet the eligibility criteria' }),
    ).not.toBeInTheDocument();
  });
});
