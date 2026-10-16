import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedRadio } from './SegmentedRadio';

const options = [
  { value: 'bad', label: 'Poor credit' },
  { value: 'good', label: 'Good credit' },
  { value: 'over_limit', label: 'Over limit' },
] as const;

describe('SegmentedRadio', () => {
  it('exposes a radiogroup with the given accessible name', () => {
    render(
      <SegmentedRadio
        name="creditCheckState"
        aria-label="Simulated credit check scenario"
        options={options}
        value="good"
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByRole('radiogroup', { name: 'Simulated credit check scenario' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Good credit' })).toBeChecked();
  });

  it('notifies callers when a different option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedRadio
        name="creditCheckState"
        aria-label="Simulated credit check scenario"
        options={options}
        value="good"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Poor credit' }));

    expect(onChange).toHaveBeenCalledWith('bad');
  });

  it('does not notify callers when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedRadio
        name="creditCheckState"
        aria-label="Simulated credit check scenario"
        options={options}
        value="good"
        disabled
        onChange={onChange}
      />,
    );

    const poorOption = screen.getByRole('radio', { name: 'Poor credit' });
    expect(poorOption).toBeDisabled();

    await user.click(poorOption);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets Tab move between every option chip', async () => {
    const user = userEvent.setup();

    render(
      <SegmentedRadio
        name="creditCheckState"
        aria-label="Simulated credit check scenario"
        options={options}
        value="good"
        onChange={() => {}}
      />,
    );

    const poorChip = screen.getByText('Poor credit').closest('label');
    const goodChip = screen.getByText('Good credit').closest('label');
    const overLimitChip = screen.getByText('Over limit').closest('label');

    expect(poorChip).toHaveAttribute('tabIndex', '0');
    expect(goodChip).toHaveAttribute('tabIndex', '0');
    expect(overLimitChip).toHaveAttribute('tabIndex', '0');

    poorChip?.focus();
    expect(poorChip).toHaveFocus();

    await user.tab();
    expect(goodChip).toHaveFocus();

    await user.tab();
    expect(overLimitChip).toHaveFocus();
  });

  it('moves selection and focus with arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedRadio
        name="creditCheckState"
        aria-label="Simulated credit check scenario"
        options={options}
        value="good"
        onChange={onChange}
      />,
    );

    const goodChip = screen.getByText('Good credit').closest('label');
    goodChip?.focus();
    expect(goodChip).toHaveFocus();

    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('Over limit').closest('label')).toHaveFocus();
    expect(onChange).toHaveBeenCalledWith('over_limit');
  });

  it('renders helper text and wires it to the radiogroup', () => {
    render(
      <SegmentedRadio
        name="creditCheckState"
        aria-label="Simulated credit check scenario"
        options={options}
        value="good"
        helperText="Demo scenarios only. No real credit check is performed."
        onChange={() => {}}
      />,
    );

    const helper = screen.getByText('Demo scenarios only. No real credit check is performed.');
    const group = screen.getByRole('radiogroup', { name: 'Simulated credit check scenario' });

    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
  });
});
