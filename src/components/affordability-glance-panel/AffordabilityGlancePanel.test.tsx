import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ringStyles from '../circular-progress-ring/CircularProgressRing.module.scss';
import { formatMoneyExact } from '../../utils/formatMoney';
import { AffordabilityGlancePanel } from './AffordabilityGlancePanel';

describe('AffordabilityGlancePanel', () => {
  it('renders income, budget composition bar, breakdown, indicators, and risk', () => {
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
        approvalLikelihood={85}
        riskCategory="low"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Affordability at a glance' })).toBeInTheDocument();
    expect(screen.getByText('Monthly income')).toBeInTheDocument();
    expect(screen.getByText(formatMoneyExact(25000))).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Budget composition: Monthly expenses ${formatMoneyExact(15000)}, Existing debt ${formatMoneyExact(5000)}, New repayment ${formatMoneyExact(7089.5)}, Disposable income ${formatMoneyExact(10000)}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Disposable income')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Debt-to-income ratio: 20%' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Affordability rating: Good' })).toBeInTheDocument();
    expect(screen.getByText('Risk category')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
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
        approvalLikelihood={85}
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
        approvalLikelihood={85}
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
        approvalLikelihood={85}
        riskCategory="low"
      />,
    );

    expect(screen.getByRole('status', { name: 'Affordability rating: Poor' })).toHaveClass(
      ringStyles.tonePoor,
    );
  });
});
