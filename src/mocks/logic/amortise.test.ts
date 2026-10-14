import { describe, expect, it } from 'vitest';

import { amortiseLoan, pickRatePercent } from './amortise';

describe('pickRatePercent', () => {
  it('returns a mid-band rate when creditScore is omitted', () => {
    expect(pickRatePercent({ loanType: 'personal_loan' })).toBe(14.5);
  });

  it('returns a lower rate when creditScore is high', () => {
    expect(pickRatePercent({ loanType: 'personal_loan', creditScore: 750 })).toBeLessThan(
      pickRatePercent({ loanType: 'personal_loan' }),
    );
  });
});

describe('amortiseLoan', () => {
  it('returns monthly payment and a schedule length equal to term', () => {
    const result = amortiseLoan({
      principal: 150_000,
      termMonths: 24,
      annualRatePercent: 12.5,
    });
    expect(result.paymentSchedule).toHaveLength(24);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.totalRepayment).toBeGreaterThan(result.monthlyPayment);
  });
});
