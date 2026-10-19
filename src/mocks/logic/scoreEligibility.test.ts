import { describe, expect, it } from 'vitest';

import type { EligibilityRequest } from '../../types/api';
import { pickRatePercent, principalFromPayment } from './amortise';
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

/** Matches the screenshot fixture: R60k vehicle loan, tight monthly budget. */
const screenshotRequest = (): EligibilityRequest => ({
  personalInfo: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
  financialInfo: {
    monthlyIncome: 5000,
    monthlyExpenses: 1000,
    existingDebt: 1500,
  },
  loanDetails: {
    requestedAmount: 60000,
    loanTerm: 45,
    loanPurpose: 'new_vehicle',
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

  it('computes debt-to-income from existing debt and new repayment only, excluding living expenses', () => {
    const result = scoreEligibility(screenshotRequest());
    const payment = result.recommendedLoan.monthlyPayment;
    const expectedDti = Math.round(((1500 + payment) / 5000) * 100 * 100) / 100;

    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBe(expectedDti);
    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBeCloseTo(63.1, 0);
    expect(result.affordabilityAnalysis.affordabilityScore).toBe('poor');
  });

  it('uses a stretched affordability decision reason when eligible with poor DTI', () => {
    const result = scoreEligibility(screenshotRequest());

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.eligibilityResult.decisionReason).toMatch(/stretched|limited disposable/i);
    expect(result.eligibilityResult.decisionReason).not.toMatch(/Strong income-to-expense/i);
  });

  it('returns affordability-based maxAmount capped by product max when eligible', () => {
    const request = screenshotRequest();
    const result = scoreEligibility(request);
    const interestRate = pickRatePercent({ loanType: 'vehicle_loan' });
    const maxMonthlyPayment =
      request.financialInfo.monthlyIncome -
      request.financialInfo.monthlyExpenses -
      request.financialInfo.existingDebt;
    const expectedPrincipal = principalFromPayment({
      monthlyPayment: maxMonthlyPayment,
      termMonths: request.loanDetails.loanTerm,
      annualRatePercent: interestRate,
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.recommendedLoan.maxAmount).toBe(expectedPrincipal);
    expect(result.recommendedLoan.maxAmount).toBeGreaterThan(request.loanDetails.requestedAmount);
    expect(result.recommendedLoan.maxAmount).not.toBe(
      Math.min(
        request.loanDetails.requestedAmount * 1.2,
        request.loanDetails.requestedAmount + 50000,
      ),
    );
  });

  it('returns maxAmount of 0 when ineligible', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      personalInfo: {
        ...baseRequest().personalInfo,
        age: 17,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.recommendedLoan.maxAmount).toBe(0);
  });

  it('returns approvalLikelihood 55 and high risk when credit score is omitted', () => {
    const result = scoreEligibility(screenshotRequest());

    expect(result.eligibilityResult.approvalLikelihood).toBe(55);
    expect(result.eligibilityResult.riskCategory).toBe('high');
  });

  it('keeps loan-to-income as requested amount over annual income', () => {
    const result = scoreEligibility(screenshotRequest());

    expect(result.affordabilityAnalysis.loanToIncomeRatio).toBe(100);
  });

  it('uses strong decision reason when eligible with good DTI', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        monthlyIncome: 50000,
        monthlyExpenses: 5000,
        existingDebt: 500,
      },
      loanDetails: {
        requestedAmount: 20000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.affordabilityAnalysis.affordabilityScore).toBe('good');
    expect(result.eligibilityResult.decisionReason).toBe(
      'Strong income-to-expense ratio and manageable existing debt',
    );
  });
});
