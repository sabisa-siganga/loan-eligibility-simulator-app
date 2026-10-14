import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PurposeCard } from './PurposeCard';

describe('PurposeCard', () => {
  it('notifies when selected and supports the disabled state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <PurposeCard
        purposeId="home_improvement"
        name="purpose"
        checked={false}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText('Home improvement'));
    expect(onChange).toHaveBeenCalledWith('home_improvement');

    rerender(
      <PurposeCard
        purposeId="home_improvement"
        name="purpose"
        checked
        onChange={onChange}
        disabled
      />,
    );

    expect(screen.getByLabelText('Home improvement')).toBeDisabled();
  });
});
