import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Input } from './Input';

describe('Input', () => {
  it('forwards refs to the native input element', () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} aria-label="Loan amount" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByLabelText('Loan amount'));
  });

  it('marks invalid inputs with aria-invalid for styling hooks', () => {
    render(<Input aria-label="Loan amount" aria-invalid="true" />);

    const input = screen.getByLabelText('Loan amount');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).not.toMatch(/error/i);
  });

  it('does not invent a separate error class when aria-invalid is absent', () => {
    render(<Input aria-label="Loan amount" />);

    const input = screen.getByLabelText('Loan amount');

    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(input.className).not.toMatch(/error/i);
  });
});

