import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { MoneyInput } from './MoneyInput';

const ControlledMoneyInput = () => {
  const [value, setValue] = useState('');
  return (
    <MoneyInput label="Required amount" value={value} onChange={setValue} helperText="range" />
  );
};

describe('MoneyInput', () => {
  it('strips non-digits from typed input', async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyInput />);

    await user.type(screen.getByLabelText(/Required amount/), '12a3');
    expect(screen.getByLabelText(/Required amount/)).toHaveValue('123');
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
});
