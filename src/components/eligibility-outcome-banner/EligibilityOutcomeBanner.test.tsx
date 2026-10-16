import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EligibilityOutcomeBanner } from './EligibilityOutcomeBanner';

describe('EligibilityOutcomeBanner', () => {
  it('renders the eligible outcome heading and decision reason', () => {
    render(
      <EligibilityOutcomeBanner
        isEligible
        decisionReason="Strong income-to-expense ratio and manageable existing debt"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'You meet the eligibility criteria' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Strong income-to-expense ratio and manageable existing debt'),
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
});
