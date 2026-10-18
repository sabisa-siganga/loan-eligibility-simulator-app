import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MoneyInput } from './MoneyInput';

const ControlledMoneyInput = ({
  onChangeSpy,
}: {
  readonly onChangeSpy?: (value: string) => void;
}) => {
  const [value, setValue] = useState('');
  return (
    <MoneyInput
      label="Required amount"
      value={value}
      onChange={(next) => {
        onChangeSpy?.(next);
        setValue(next);
      }}
      helperText="range"
    />
  );
};

describe('MoneyInput', () => {
  it('strips non-digits from typed input', async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyInput />);

    await user.type(screen.getByLabelText(/Required amount/), '12a3');
    expect(screen.getByLabelText(/Required amount/)).toHaveValue('123');
  });

  it('shows grouped amount with two decimals after blur', async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyInput />);

    const input = screen.getByLabelText(/Required amount/);
    await user.type(input, '30000');
    await user.tab();

    expect(input).toHaveValue('30 000.00');
  });

  it('shows digits only again when focused after blur', async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyInput />);

    const input = screen.getByLabelText(/Required amount/);
    await user.type(input, '30000');
    await user.tab();
    await user.click(input);

    expect(input).toHaveValue('30000');
  });

  it('keeps onChange payloads digit-only', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<ControlledMoneyInput onChangeSpy={onChangeSpy} />);

    const input = screen.getByLabelText(/Required amount/);
    await user.type(input, '30000');
    await user.tab();

    expect(onChangeSpy.mock.calls.every(([next]) => /^\d*$/.test(next))).toBe(true);
    expect(onChangeSpy).toHaveBeenLastCalledWith('30000');
    expect(input).toHaveValue('30 000.00');
  });

  it('keeps an empty field empty after blur', async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyInput />);

    const input = screen.getByLabelText(/Required amount/);
    await user.click(input);
    await user.tab();

    expect(input).toHaveValue('');
  });

  it('marks required fields and surfaces errors', () => {
    render(
      <MoneyInput
        label="Required amount"
        value="100"
        onChange={() => undefined}
        required
        error="Too low"
      />,
    );

    expect(screen.getByLabelText(/Required amount/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Too low')).toBeInTheDocument();
  });

  it('hides helper text while an error is shown', () => {
    render(
      <MoneyInput
        label="Required amount"
        value="100"
        onChange={() => undefined}
        helperText="R5 000 to R300 000"
        error="Too low"
      />,
    );

    expect(screen.getByText('Too low')).toBeInTheDocument();
    expect(screen.queryByText('R5 000 to R300 000')).not.toBeInTheDocument();
  });
});
