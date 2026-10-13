import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';

const options = [
  { value: '', label: 'Select a purpose' },
  { value: 'home', label: 'Home improvement' },
  { value: 'debt', label: 'Debt consolidation' },
] as const;

describe('Select', () => {
  it('wires label, helper, and error descriptions to the control', () => {
    render(
      <Select
        label="Loan purpose"
        options={options}
        helperText="Choose the closest match"
        errorText="Purpose is required"
        required
      />,
    );

    const select = screen.getByLabelText(/Loan purpose/);

    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-required', 'true');
    expect(select.getAttribute('aria-describedby')).toContain(
      screen.getByText('Choose the closest match').id,
    );
    expect(select.getAttribute('aria-describedby')).toContain(
      screen.getByRole('alert').id,
    );
  });

  it('notifies callers when the value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select label="Loan purpose" options={options} value="" onChange={onChange} />,
    );

    await user.selectOptions(screen.getByLabelText('Loan purpose'), 'home');

    expect(onChange).toHaveBeenCalled();
  });

  it('drives invalid field styling from aria-invalid instead of an error class', () => {
    render(
      <Select
        label="Loan purpose"
        options={options}
        errorText="Purpose is required"
      />,
    );

    const select = screen.getByLabelText('Loan purpose');

    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select.className).not.toMatch(/error/i);
  });
});

