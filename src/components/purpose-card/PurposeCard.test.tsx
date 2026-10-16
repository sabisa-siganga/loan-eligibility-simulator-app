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

    await user.click(screen.getByRole('radio', { name: 'Home improvement' }));
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

    expect(screen.getByRole('radio', { name: 'Home improvement' })).toBeDisabled();
  });

  it('marks the radio required when requested and hides decorative chrome from AT', () => {
    const { container } = render(
      <PurposeCard
        purposeId="new_vehicle"
        name="purpose"
        checked={false}
        required
        onChange={() => undefined}
      />,
    );

    const radio = screen.getByRole('radio', { name: 'New vehicle' });
    expect(radio).toBeRequired();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector(`.${styles.indicator}`)).toHaveAttribute('aria-hidden', 'true');
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

  it('makes the card label a tab stop and supports arrow-key selection within a radio group', async () => {
    const user = userEvent.setup();
    render(<PurposeGroup />);

    const home = screen.getByLabelText('Home improvement');
    const education = screen.getByLabelText('Education');
    const homeCard = home.closest('label');
    const educationCard = education.closest('label');

    expect(homeCard).toHaveAttribute('tabIndex', '0');
    expect(home).toHaveAttribute('tabIndex', '-1');

    await user.tab();
    expect(homeCard).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(education).toBeChecked();
    expect(educationCard).toHaveFocus();
  });
});
