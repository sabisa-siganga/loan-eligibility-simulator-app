import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResultUnavailable } from './ResultUnavailable';

describe('ResultUnavailable', () => {
  it('renders the missing-result copy and calls onReturn from the primary action', async () => {
    const user = userEvent.setup();
    const onReturn = vi.fn();

    render(<ResultUnavailable kind="none" onReturn={onReturn} />);

    expect(screen.getByRole('heading', { name: 'No eligibility result yet' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Check your eligibility from your details to see your outcome and recommended loan.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to your details' }));
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('renders the outdated-result copy and calls onReturn from the primary action', async () => {
    const user = userEvent.setup();
    const onReturn = vi.fn();

    render(<ResultUnavailable kind="outdated" onReturn={onReturn} />);

    expect(screen.getByRole('heading', { name: 'Your result is out of date' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'You changed your details after your last check. Check your eligibility again to see an updated result.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Check eligibility again' }));
    expect(onReturn).toHaveBeenCalledTimes(1);
  });
});
