import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResultDetailList } from './ResultDetailList';

describe('ResultDetailList', () => {
  it('renders labels and values for each item', () => {
    render(
      <ResultDetailList
        items={[
          { label: 'Product', value: 'Personal Loan' },
          { label: 'Purpose', value: 'Home improvement' },
        ]}
      />,
    );

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('Home improvement')).toBeInTheDocument();
  });

  it('shows Not available when a value is null', () => {
    render(<ResultDetailList items={[{ label: 'Annual interest', value: null }]} />);

    expect(screen.getByText('Annual interest')).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('renders a color swatch when swatchClassName is provided', () => {
    const { container } = render(
      <ResultDetailList
        items={[
          {
            label: 'Monthly expenses',
            value: 'R 15 000.00',
            swatchClassName: 'tone-expenses',
            swatchKey: 'monthlyExpenses',
          },
        ]}
      />,
    );

    const swatch = container.querySelector('[data-swatch="monthlyExpenses"]');
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveAttribute('aria-hidden', 'true');
    expect(swatch?.className).toContain('tone-expenses');
  });

  it('omits the swatch when swatchClassName is not provided', () => {
    const { container } = render(
      <ResultDetailList items={[{ label: 'Product', value: 'Personal Loan' }]} />,
    );

    expect(container.querySelector('[data-swatch]')).not.toBeInTheDocument();
  });
});
