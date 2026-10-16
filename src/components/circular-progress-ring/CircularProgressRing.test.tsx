import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CircularProgressRing, StatusCircle } from './CircularProgressRing';
import styles from './CircularProgressRing.module.scss';

describe('CircularProgressRing', () => {
  it('exposes an accessible name with the label and display value', () => {
    render(<CircularProgressRing value={85} label="Approval likelihood" displayValue="85%" />);

    expect(screen.getByRole('img', { name: 'Approval likelihood: 85%' })).toBeInTheDocument();
    expect(screen.getByText('Approval likelihood')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('retains displayed values above 100 while capping the decorative fill', () => {
    const { container } = render(
      <CircularProgressRing value={120} label="Debt-to-income ratio" displayValue="120%" />,
    );

    expect(screen.getByText('120%')).toBeInTheDocument();
    const progress = container.querySelector('circle[stroke-dasharray]');
    expect(progress).not.toBeNull();
  });
});

describe('StatusCircle', () => {
  it('treats the affordability rating as a status, not numeric progress', () => {
    render(<StatusCircle status="Good" label="Affordability rating" />);

    expect(screen.getByRole('status', { name: 'Affordability rating: Good' })).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Affordability rating')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('defaults to a neutral tone when none is provided', () => {
    render(<StatusCircle status="Fair" label="Affordability rating" />);

    expect(screen.getByRole('status', { name: 'Affordability rating: Fair' })).toHaveClass(
      styles.toneNeutral,
    );
  });

  it('applies good, fair, and poor tone classes from the tone prop', () => {
    const { rerender } = render(
      <StatusCircle status="Good" label="Affordability rating" tone="good" />,
    );
    expect(screen.getByRole('status', { name: 'Affordability rating: Good' })).toHaveClass(
      styles.toneGood,
    );

    rerender(<StatusCircle status="Fair" label="Affordability rating" tone="fair" />);
    expect(screen.getByRole('status', { name: 'Affordability rating: Fair' })).toHaveClass(
      styles.toneFair,
    );

    rerender(<StatusCircle status="Poor" label="Affordability rating" tone="poor" />);
    expect(screen.getByRole('status', { name: 'Affordability rating: Poor' })).toHaveClass(
      styles.tonePoor,
    );
  });
});
