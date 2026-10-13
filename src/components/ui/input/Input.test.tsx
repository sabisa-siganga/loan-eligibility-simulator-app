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

    expect(screen.getByLabelText('Loan amount')).toHaveAttribute('aria-invalid', 'true');
  });
});
