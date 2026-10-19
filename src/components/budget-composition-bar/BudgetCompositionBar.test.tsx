import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatMoneyExact } from '../../utils/formatMoney';
import { BudgetCompositionBar } from './BudgetCompositionBar';

describe('BudgetCompositionBar', () => {
  it('renders four segments with widths proportional to the four amounts', () => {
    const { container } = render(
      <BudgetCompositionBar
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
      />,
    );

    const bar = screen.getByRole('img', { name: /Budget composition/i });
    expect(bar).toBeInTheDocument();

    const expenses = container.querySelector('[data-segment="monthlyExpenses"]');
    const debt = container.querySelector('[data-segment="existingDebt"]');
    const repayment = container.querySelector('[data-segment="newRepayment"]');
    const disposable = container.querySelector('[data-segment="disposableIncome"]');

    expect(expenses).toHaveStyle({ flexGrow: '15000' });
    expect(debt).toHaveStyle({ flexGrow: '5000' });
    expect(repayment).toHaveStyle({ flexGrow: '7089.5' });
    expect(disposable).toHaveStyle({ flexGrow: '10000' });
  });

  it('omits the new-repayment segment when newRepayment is null', () => {
    const { container } = render(
      <BudgetCompositionBar
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={null}
        disposableIncome={10000}
      />,
    );

    expect(container.querySelector('[data-segment="newRepayment"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-segment="monthlyExpenses"]')).toBeInTheDocument();
    expect(container.querySelector('[data-segment="existingDebt"]')).toBeInTheDocument();
    expect(container.querySelector('[data-segment="disposableIncome"]')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Budget composition: Monthly expenses ${formatMoneyExact(15000)}, Existing monthly debt repayments ${formatMoneyExact(5000)}, Remaining monthly income ${formatMoneyExact(10000)}`,
      }),
    ).toBeInTheDocument();
  });

  it('hides the bar when all contributory amounts are 0', () => {
    const { container } = render(
      <BudgetCompositionBar
        monthlyExpenses={0}
        existingDebt={0}
        newRepayment={0}
        disposableIncome={0}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('img', { name: /Budget composition/i })).not.toBeInTheDocument();
  });

  it('exposes a useful role="img" label including Budget composition', () => {
    render(
      <BudgetCompositionBar
        monthlyExpenses={15000}
        existingDebt={5000}
        newRepayment={7089.5}
        disposableIncome={10000}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: `Budget composition: Monthly expenses ${formatMoneyExact(15000)}, Existing monthly debt repayments ${formatMoneyExact(5000)}, New repayment ${formatMoneyExact(7089.5)}, Remaining monthly income ${formatMoneyExact(10000)}`,
      }),
    ).toBeInTheDocument();
  });
});
