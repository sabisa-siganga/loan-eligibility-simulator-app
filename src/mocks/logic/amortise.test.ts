import { describe, expect, it } from 'vitest';

import { amortiseLoan, pickRatePercent, principalFromPayment } from './amortise';

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

describe('principalFromPayment', () => {
  it('returns 0 when monthly payment is non-positive', () => {
    expect(
      principalFromPayment({
        monthlyPayment: 0,
        termMonths: 24,
        annualRatePercent: 12.5,
      }),
    ).toBe(0);
  });

  it('round-trips with amortiseLoan within one cent of monthly payment', () => {
    const principal = 60_000;
    const termMonths = 45;
    const annualRatePercent = 11.75;
    const quote = amortiseLoan({ principal, termMonths, annualRatePercent });
    const recovered = principalFromPayment({
      monthlyPayment: quote.monthlyPayment,
      termMonths,
      annualRatePercent,
    });
    const requote = amortiseLoan({
      principal: recovered,
      termMonths,
      annualRatePercent,
    });

    expect(Math.abs(requote.monthlyPayment - quote.monthlyPayment)).toBeLessThanOrEqual(0.01);
  });
});
