import { describe, expect, it } from 'vitest';

import type { EligibilityRequest } from '../../types/api';
import { scoreEligibility } from './scoreEligibility';

const baseRequest = (): EligibilityRequest => ({
  personalInfo: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
  financialInfo: {
    monthlyIncome: 25000,
    monthlyExpenses: 8000,
    existingDebt: 2000,
  },
  loanDetails: {
    requestedAmount: 150000,
    loanTerm: 24,
    loanPurpose: 'home_improvement',
  },
});

describe('scoreEligibility', () => {
  it('marks ineligible when age is below 18', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      personalInfo: {
        ...baseRequest().personalInfo,
        age: 17,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toMatch(/age/i);
  });

  it('returns higher approvalLikelihood when creditScore is present than when omitted', () => {
    const withoutScore = scoreEligibility(baseRequest());
    const withScore = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 720,
      },
    });

    expect(withScore.eligibilityResult.approvalLikelihood).toBeGreaterThan(
      withoutScore.eligibilityResult.approvalLikelihood,
    );
  });

  it('marks eligible when creditScore is within validation bounds', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 550,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
  });

  it('marks ineligible when creditScore is below validation min even if affordability passes', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 200,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toBe(
      'Credit score must be between 300 and 850',
    );
    expect(result.recommendedLoan.monthlyPayment).toBe(0);
  });

  it('marks ineligible when creditScore is above validation max even if affordability passes', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 900,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toBe(
      'Credit score must be between 300 and 850',
    );
    expect(result.recommendedLoan.monthlyPayment).toBe(0);
  });

  it('includes recommendedLoan.monthlyPayment greater than 0 when eligible', () => {
    const result = scoreEligibility(baseRequest());

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.recommendedLoan.monthlyPayment).toBeGreaterThan(0);
  });

  it('marks ineligible when disposable income is negative', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        monthlyIncome: 6000,
        monthlyExpenses: 5000,
        existingDebt: 1000,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.affordabilityAnalysis.disposableIncome).toBeLessThan(0);
  });
});
