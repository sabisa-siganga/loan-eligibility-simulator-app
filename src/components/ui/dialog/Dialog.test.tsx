import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('exposes dialog semantics and focuses the close control when opened', () => {
    render(
      <Dialog open title="Confirm reset" onClose={() => {}}>
        <p>This clears your progress.</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Confirm reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Dialog open title="Confirm reset" onClose={onClose}>
        <p>This clears your progress.</p>
      </Dialog>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false} title="Confirm reset" onClose={() => {}}>
        <p>Hidden</p>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('traps Tab focus from the last control back to the first', async () => {
    const user = userEvent.setup();

    render(
      <Dialog open title="Confirm reset" onClose={() => {}}>
        <button type="button">Secondary action</button>
      </Dialog>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const secondaryButton = screen.getByRole('button', { name: 'Secondary action' });

    secondaryButton.focus();
    await user.tab();

    expect(closeButton).toHaveFocus();
  });

  it('traps Shift+Tab focus from the first control back to the last', async () => {
    const user = userEvent.setup();

    render(
      <Dialog open title="Confirm reset" onClose={() => {}}>
        <button type="button">Secondary action</button>
      </Dialog>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const secondaryButton = screen.getByRole('button', { name: 'Secondary action' });

    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });

    expect(secondaryButton).toHaveFocus();
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(
      <Dialog open title="Confirm reset" onClose={() => {}}>
        <p>Open</p>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Dialog open={false} title="Confirm reset" onClose={() => {}}>
        <p>Closed</p>
      </Dialog>,
    );

    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
