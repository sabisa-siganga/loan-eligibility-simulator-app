import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InfoNotice } from './InfoNotice';

describe('InfoNotice', () => {
  it('renders notice copy for assistive technologies', () => {
    render(
      <InfoNotice>
        Eligibility is an estimate. Final approval is subject to verification.
      </InfoNotice>,
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      'Eligibility is an estimate. Final approval is subject to verification.',
    );
  });
});
