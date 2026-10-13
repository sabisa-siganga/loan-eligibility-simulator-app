import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('defaults to type button and the primary variant', () => {
    render(<Button>Continue</Button>);

    const button = screen.getByRole('button', { name: 'Continue' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button.className).toMatch(/primary/);
  });

  it('applies the requested visual variant', () => {
    render(<Button variant="secondary">Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' }).className).toMatch(/secondary/);
  });

  it('keeps outline focus on the button element for keyboard users', () => {
    render(<Button>Continue</Button>);

    const button = screen.getByRole('button', { name: 'Continue' });

    button.focus();
    expect(button).toHaveFocus();
    expect(button.tagName).toBe('BUTTON');
  });
});
