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
  it('hides helper and wires error description when both are provided', () => {
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
    const error = screen.getByRole('alert');

    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-required', 'true');
    expect(screen.queryByText('Choose the closest match')).not.toBeInTheDocument();
    expect(select.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('notifies callers when the value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Select label="Loan purpose" options={options} value="" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Loan purpose'), 'home');

    expect(onChange).toHaveBeenCalled();
  });

  it('drives invalid field styling from aria-invalid instead of an error class', () => {
    render(<Select label="Loan purpose" options={options} errorText="Purpose is required" />);

    const select = screen.getByLabelText('Loan purpose');

    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select.className).not.toMatch(/error/i);
  });
});
