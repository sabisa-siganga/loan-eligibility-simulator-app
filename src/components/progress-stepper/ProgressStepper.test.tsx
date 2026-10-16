import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProgressStepper } from './ProgressStepper';

const steps = [
  { id: 'loanDetails', label: 'Your loan' },
  { id: 'yourBudget', label: 'Your details' },
  { id: 'yourResult', label: 'Eligibility' },
] as const;

describe('ProgressStepper', () => {
  it('invokes onStepClick with the completed step id when that step is clicked', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();

    render(
      <ProgressStepper
        steps={steps}
        currentStepId="yourResult"
        completedStepIds={['loanDetails', 'yourBudget']}
        onStepClick={onStepClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Your loan/i }));

    expect(onStepClick).toHaveBeenCalledTimes(1);
    expect(onStepClick).toHaveBeenCalledWith('loanDetails');
  });

  it('does not render current or upcoming steps as buttons', () => {
    const onStepClick = vi.fn();

    render(
      <ProgressStepper
        steps={steps}
        currentStepId="yourBudget"
        completedStepIds={['loanDetails']}
        onStepClick={onStepClick}
      />,
    );

    expect(screen.getByRole('button', { name: /Your loan/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Your details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eligibility/i })).not.toBeInTheDocument();
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it('marks the current step with aria-current="step"', () => {
    render(
      <ProgressStepper
        steps={steps}
        currentStepId="yourResult"
        completedStepIds={['loanDetails', 'yourBudget']}
      />,
    );

    const currentItem = screen.getByText('Eligibility').closest('li');
    expect(currentItem).toHaveAttribute('aria-current', 'step');
  });
});
