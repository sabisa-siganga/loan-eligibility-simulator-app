import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrorText } from './ErrorText';

describe('ErrorText', () => {
  it('defaults role to alert for screen readers', () => {
    render(<ErrorText>Amount is required</ErrorText>);

    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required');
  });

  it('allows callers to override the alert role', () => {
    render(<ErrorText role="status">Saved</ErrorText>);

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
