import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PurposeCard } from './PurposeCard';
import styles from './PurposeCard.module.scss';

const PurposeGroup = () => {
  const [selected, setSelected] = useState('home_improvement');

  return (
    <div role="radiogroup" aria-label="Loan purpose">
      <PurposeCard
        purposeId="home_improvement"
        name="purpose"
        checked={selected === 'home_improvement'}
        onChange={setSelected}
      />
      <PurposeCard
        purposeId="education"
        name="purpose"
        checked={selected === 'education'}
        onChange={setSelected}
      />
    </div>
  );
};

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

  it('applies the selected class so hover cannot restyle an active card via CSS', () => {
    const { container } = render(
      <PurposeCard
        purposeId="home_improvement"
        name="purpose"
        checked
        onChange={() => undefined}
      />,
    );

    const card = container.querySelector(`.${styles.card}`);
    expect(card).toHaveClass(styles.selected);
  });

  it('supports keyboard focus and arrow-key selection within a radio group', async () => {
    const user = userEvent.setup();
    render(<PurposeGroup />);

    const home = screen.getByLabelText('Home improvement');
    const education = screen.getByLabelText('Education');

    await user.tab();
    expect(home).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(education).toBeChecked();
    expect(education).toHaveFocus();
  });
});
