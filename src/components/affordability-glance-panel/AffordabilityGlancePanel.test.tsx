import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ringStyles from '../circular-progress-ring/CircularProgressRing.module.scss';
import { formatMoneyExact } from '../../utils/formatMoney';
import { AffordabilityGlancePanel } from './AffordabilityGlancePanel';

describe('AffordabilityGlancePanel', () => {
  it('renders income, budget composition bar, breakdown, indicators, and overall risk', () => {
    render(
      <AffordabilityGlancePanel
        monthlyIncome={25000}
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
        debtToIncomeRatio={20}
        loanToIncomeRatio={60}
        affordabilityScore="good"
        approvalLikelihood={null}
        riskCategory="low"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Affordability at a glance' })).toBeInTheDocument();
    expect(screen.getByText('Monthly take-home income')).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(25000))).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Budget composition: Monthly expenses ${formatMoneyExact(15000)}, Existing monthly debt repayments ${formatMoneyExact(5000)}, New repayment ${formatMoneyExact(7089.5)}, Remaining monthly income ${formatMoneyExact(10000)}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Remaining monthly income')).toBeInTheDocument();
    expect(screen.getByText('Existing monthly debt repayments')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Debt-to-income ratio: 20%' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Requested loan-to-annual-income ratio: 60%' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Affordability rating: Good' })).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Simulated approval estimate: Not available' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This estimate uses mock rules for this simulator/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Overall risk')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('shows Not fully assessed when risk category is null', () => {
    render(
      <AffordabilityGlancePanel
        monthlyIncome={30000}
        monthlyExpenses={10000}
        existingDebt={10000}
        newRepayment={1655}
        disposableIncome={8345}
        debtToIncomeRatio={38.85}
        loanToIncomeRatio={16.67}
        affordabilityScore="fair"
        approvalLikelihood={null}
        riskCategory={null}
      />,
    );

    expect(screen.getByText('Overall risk')).toBeInTheDocument();
    expect(screen.getByText('Not fully assessed')).toBeInTheDocument();
  });

  it('renders a percent ring when approval estimate is a genuine number including zero', () => {
    render(
      <AffordabilityGlancePanel
        monthlyIncome={25000}
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
        debtToIncomeRatio={20}
        loanToIncomeRatio={60}
        affordabilityScore="good"
        approvalLikelihood={0}
        riskCategory="low"
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Simulated approval estimate: 0%' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: 'Simulated approval estimate: Not available' }),
    ).not.toBeInTheDocument();
  });

  it('shows Not available when loan-to-income ratio is null', () => {
    render(
      <AffordabilityGlancePanel
        monthlyIncome={25000}
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
        debtToIncomeRatio={20}
        loanToIncomeRatio={null}
        affordabilityScore="good"
        approvalLikelihood={null}
        riskCategory="low"
      />,
    );

    expect(
      screen.getByRole('status', {
        name: 'Requested loan-to-annual-income ratio: Not available',
      }),
    ).toBeInTheDocument();
  });

  it('pairs each legend swatch with the matching bar segment tone class', () => {
    const { container } = render(
      <AffordabilityGlancePanel
        monthlyIncome={25000}
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
        debtToIncomeRatio={20}
        loanToIncomeRatio={60}
        affordabilityScore="good"
        approvalLikelihood={null}
        riskCategory="low"
      />,
    );

    const segmentKeys = [
      'monthlyExpenses',
      'existingDebt',
      'newRepayment',
      'disposableIncome',
    ] as const;

    segmentKeys.forEach((key) => {
      const segment = container.querySelector(`[data-segment="${key}"]`);
      const swatch = container.querySelector(`[data-swatch="${key}"]`);
      expect(segment).toBeInTheDocument();
      expect(swatch).toBeInTheDocument();

      const segmentToneClass = Array.from(segment?.classList ?? []).find((className) =>
        className.includes('tone'),
      );
      const swatchToneClass = Array.from(swatch?.classList ?? []).find((className) =>
        className.includes('tone'),
      );
      expect(segmentToneClass).toBeTruthy();
      expect(swatchToneClass).toBe(segmentToneClass);
    });
  });

  it('applies the affordability rating tone class from the score', () => {
    const { rerender } = render(
      <AffordabilityGlancePanel
        monthlyIncome={25000}
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
        debtToIncomeRatio={20}
        loanToIncomeRatio={60}
        affordabilityScore="fair"
        approvalLikelihood={null}
        riskCategory="low"
      />,
    );

    expect(screen.getByRole('status', { name: 'Affordability rating: Fair' })).toHaveClass(
      ringStyles.toneFair,
    );

    rerender(
      <AffordabilityGlancePanel
        monthlyIncome={25000}
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
        debtToIncomeRatio={20}
        loanToIncomeRatio={60}
        affordabilityScore="poor"
        approvalLikelihood={null}
        riskCategory="low"
      />,
    );

    expect(screen.getByRole('status', { name: 'Affordability rating: Poor' })).toHaveClass(
      ringStyles.tonePoor,
    );
  });
});
