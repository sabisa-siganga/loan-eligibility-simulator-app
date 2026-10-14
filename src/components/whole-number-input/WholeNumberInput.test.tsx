import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { WholeNumberInput } from './WholeNumberInput';

const ControlledTermInput = () => {
  const [value, setValue] = useState('');
  return (
    <WholeNumberInput
      label="Term"
      value={value}
      onChange={setValue}
      suffix="months"
      helpText="Repayment period help"
      helperText="6 to 60 months"
      required
    />
  );
};

describe('WholeNumberInput', () => {
  it('accepts digits only and exposes help text accessibly', async () => {
    const user = userEvent.setup();
    render(<ControlledTermInput />);

    await user.type(screen.getByLabelText(/^Term/), '2a4');
    expect(screen.getByLabelText(/^Term/)).toHaveValue('24');
    expect(screen.getByText('Repayment period help')).toBeInTheDocument();
  });

  it('shows an error for an invalid value', () => {
    render(
      <WholeNumberInput
        label="Your credit score"
        value="10"
        onChange={() => undefined}
        error="Out of range"
      />,
    );

    expect(screen.getByLabelText('Your credit score')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Out of range')).toBeInTheDocument();
  });

  it('hides helper text while an error is shown', () => {
    render(
      <WholeNumberInput
        label="Term"
        value="2"
        onChange={() => undefined}
        helperText="6 to 60 months"
        error="Term too short"
      />,
    );

    expect(screen.getByText('Term too short')).toBeInTheDocument();
    expect(screen.queryByText('6 to 60 months')).not.toBeInTheDocument();
  });
});
