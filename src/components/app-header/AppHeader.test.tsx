import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('opens How it works help in a dialog and restores focus on close', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    const helpButton = screen.getByRole('button', { name: 'How it works' });
    expect(helpButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(helpButton);

    expect(helpButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText(/Choose your loan type, purpose, amount and term/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(helpButton).toHaveFocus();
    expect(helpButton).toHaveAttribute('aria-expanded', 'false');
  });
});
