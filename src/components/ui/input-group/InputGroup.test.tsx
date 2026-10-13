import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from './InputGroup';

describe('InputGroup', () => {
  it('exposes data-slot markers for group structure', () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>R</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Loan amount" />
      </InputGroup>,
    );

    expect(container.querySelector('[data-slot="input-group"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="input-group-control"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="input-group-addon"]')).toHaveAttribute(
      'data-align',
      'inline-start',
    );
    expect(container.querySelector('[data-slot="input-group-text"]')).toHaveTextContent('R');
    expect(screen.getByLabelText('Loan amount')).toBeInTheDocument();
  });

  it('keeps aria-invalid on the control for group invalid styling via :has', () => {
    const { container } = render(
      <InputGroup>
        <InputGroupInput aria-label="Loan amount" aria-invalid="true" />
      </InputGroup>,
    );

    const group = container.querySelector('[data-slot="input-group"]');
    const control = screen.getByLabelText('Loan amount');

    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(group?.querySelector('[aria-invalid="true"]')).toBe(control);
    expect(control.className).not.toMatch(/error/i);
  });
});

