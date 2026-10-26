import { describe, expect, it } from 'vitest';

import type { EligibilityRequest, RiskCategory } from '../../types/api';
import { pickRatePercent, principalFromPayment } from './amortise';
import {
  AFFORDABILITY_DTI_FAIR_MAX,
  AFFORDABILITY_DTI_GOOD_MAX,
  CREDIT_SCORE_MIN,
  creditRiskFromScore,
  overallRiskFromCreditAndAffordability,
  simulatedApprovalEstimate,
} from './eligibilityThresholds';
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

/** Screenshot regression: R60k vehicle loan, no credit score. */
const screenshotRequest = (): EligibilityRequest => ({
  personalInfo: {
    age: 35,
    employmentStatus: 'employed',
    employmentDuration: 24,
  },
  financialInfo: {
    monthlyIncome: 30000,
    monthlyExpenses: 10000,
    existingDebt: 10000,
  },
  loanDetails: {
    requestedAmount: 60000,
    loanTerm: 45,
    loanPurpose: 'new_vehicle',
  },
});

/**
 * Build a request that yields a target affordability band at a given credit score.
 * Uses a large income so mandatory gates pass; tunes existingDebt + amount for DTI.
 */
const requestForRiskCell = (
  creditScore: number,
  affordability: 'good' | 'fair' | 'poor',
): EligibilityRequest => {
  const monthlyIncome = 50000;
  // Target DTI midpoints within each band (expenses excluded from DTI).
  const targetDti =
    affordability === 'good'
      ? AFFORDABILITY_DTI_GOOD_MAX - 5
      : affordability === 'fair'
        ? (AFFORDABILITY_DTI_GOOD_MAX + AFFORDABILITY_DTI_FAIR_MAX) / 2
        : AFFORDABILITY_DTI_FAIR_MAX + 10;

  // Small loan so repayment is modest; set existingDebt to drive DTI.
  const requestedAmount = 10000;
  const loanTerm = 24;
  const interestRate = pickRatePercent({ loanType: 'personal_loan', creditScore });
  const { monthlyPayment } = awaitableAmortisePlaceholder(requestedAmount, loanTerm, interestRate);

  const existingDebt = Math.max(0, Math.round((targetDti / 100) * monthlyIncome - monthlyPayment));
  const monthlyExpenses = 5000;

  return {
    personalInfo: {
      age: 35,
      employmentStatus: 'employed',
      employmentDuration: 24,
    },
    financialInfo: {
      monthlyIncome,
      monthlyExpenses,
      existingDebt,
      creditScore,
    },
    loanDetails: {
      requestedAmount,
      loanTerm,
      loanPurpose: 'home_improvement',
    },
  };
};

/** Sync amortise for test helpers — mirrors amortiseLoan payment only. */
const awaitableAmortisePlaceholder = (
  principal: number,
  termMonths: number,
  annualRatePercent: number,
): { monthlyPayment: number } => {
  const monthlyRate = annualRatePercent / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths);
  return { monthlyPayment: Math.round(payment * 100) / 100 };
};

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
    expect(result.eligibilityResult.approvalLikelihood).toBeNull();
  });

  it('returns null approvalLikelihood when credit score is missing', () => {
    const result = scoreEligibility(baseRequest());

    expect(result.eligibilityResult.approvalLikelihood).toBeNull();
    expect(result.eligibilityResult.riskAssessmentStatus).toBe('missing_credit_data');
  });

  it('maps demo credit fixtures to bands derived from validation min/max', () => {
    expect(creditRiskFromScore(CREDIT_SCORE_MIN)).toBe('high');
    expect(creditRiskFromScore(520)).toBe('medium');
    expect(creditRiskFromScore(780)).toBe('medium');

    const poor = scoreEligibility(requestForRiskCell(300, 'good'));
    const good = scoreEligibility(requestForRiskCell(520, 'good'));

    expect(poor.eligibilityResult.riskAssessmentStatus).toBe('assessed');
    expect(poor.eligibilityResult.riskCategory).toBe('high');
    expect(good.eligibilityResult.riskCategory).toBe('medium');
  });

  it('marks eligible when creditScore is within validation bounds', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 520,
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.eligibilityResult.riskAssessmentStatus).toBe('assessed');
  });

  it('returns invalid_credit_response for an out-of-range score instead of a completed assessment', () => {
    const below = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 200,
      },
    });
    const above = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        ...baseRequest().financialInfo,
        creditScore: 900,
      },
    });

    expect(below.eligibilityResult.isEligible).toBe(false);
    expect(below.eligibilityResult.riskAssessmentStatus).toBe('invalid_credit_response');
    expect(below.eligibilityResult.riskCategory).toBeNull();
    expect(below.eligibilityResult.approvalLikelihood).toBeNull();
    expect(below.eligibilityResult.decisionReason).toMatch(/between 300 and 850/i);
    expect(below.eligibilityResult.decisionReason).toMatch(/change the credit scenario/i);
    expect(below.recommendedLoan.monthlyPayment).toBe(0);
    expect(below.affordabilityAnalysis.loanToIncomeRatio).toBeNull();

    expect(above.eligibilityResult.riskAssessmentStatus).toBe('invalid_credit_response');
    expect(above.eligibilityResult.approvalLikelihood).toBeNull();
  });

  it('includes recommendedLoan.monthlyPayment greater than 0 when eligible', () => {
    const result = scoreEligibility(baseRequest());

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.recommendedLoan.monthlyPayment).toBeGreaterThan(0);
  });

  it('retains the requested-loan repayment estimate when mandatory checks fail', () => {
    const eligible = scoreEligibility(baseRequest());
    const ineligible = scoreEligibility({
      ...baseRequest(),
      personalInfo: {
        ...baseRequest().personalInfo,
        age: 17,
      },
    });

    expect(ineligible.eligibilityResult.isEligible).toBe(false);
    expect(ineligible.recommendedLoan.recommendedAmount).toBe(0);
    expect(ineligible.recommendedLoan.monthlyPayment).toBe(eligible.recommendedLoan.monthlyPayment);
    expect(ineligible.recommendedLoan.monthlyPayment).toBeGreaterThan(0);
    expect(ineligible.eligibilityResult.approvalLikelihood).toBeNull();
  });

  it('marks ineligible when remaining income is negative', () => {
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
    const expectedDti = Math.round(((10000 + payment) / 30000) * 100 * 100) / 100;

    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBe(expectedDti);
    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBe(38.85);
    expect(result.affordabilityAnalysis.affordabilityScore).toBe('fair');
  });

  it('matches the screenshot regression fixture for missing credit', () => {
    const result = scoreEligibility(screenshotRequest());

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.recommendedLoan.monthlyPayment).toBe(1655);
    expect(result.recommendedLoan.recommendedAmount).toBe(60000);
    expect(result.affordabilityAnalysis.disposableIncome).toBe(8345);
    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBe(38.85);
    expect(result.affordabilityAnalysis.loanToIncomeRatio).toBe(16.67);
    expect(result.eligibilityResult.riskCategory).toBeNull();
    expect(result.eligibilityResult.riskAssessmentStatus).toBe('missing_credit_data');
    expect(result.eligibilityResult.approvalLikelihood).toBeNull();
    expect(result.eligibilityResult.decisionReason).toMatch(/not been fully assessed/i);
    expect(result.eligibilityResult.decisionReason).toMatch(/credit information is unavailable/i);
  });

  it('returns missing_credit_data with budget warning when affordability is poor and credit is absent', () => {
    const result = scoreEligibility({
      personalInfo: {
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      },
      financialInfo: {
        monthlyIncome: 20000,
        monthlyExpenses: 2000,
        existingDebt: 8000,
      },
      loanDetails: {
        requestedAmount: 80000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.affordabilityAnalysis.affordabilityScore).toBe('poor');
    expect(result.eligibilityResult.riskAssessmentStatus).toBe('missing_credit_data');
    expect(result.eligibilityResult.riskCategory).toBeNull();
    expect(result.eligibilityResult.decisionReason).toMatch(/limited room in your budget/i);
  });

  it('returns credit_check_failed status with a distinct explanation when the check failed', () => {
    const result = scoreEligibility({
      ...screenshotRequest(),
      financialInfo: {
        ...screenshotRequest().financialInfo,
        creditCheckFailed: true,
      },
    });

    expect(result.eligibilityResult.riskAssessmentStatus).toBe('credit_check_failed');
    expect(result.eligibilityResult.riskCategory).toBeNull();
    expect(result.eligibilityResult.approvalLikelihood).toBeNull();
    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.eligibilityResult.decisionReason).toMatch(/credit check failed/i);
    expect(result.eligibilityResult.decisionReason).not.toMatch(
      /credit information is unavailable/i,
    );
  });

  it('keeps the applicant eligible when overall risk is high', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        monthlyIncome: 50000,
        monthlyExpenses: 5000,
        existingDebt: 20000,
        creditScore: CREDIT_SCORE_MIN,
      },
      loanDetails: {
        requestedAmount: 50000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.eligibilityResult.riskCategory).toBe('high');
    expect(result.eligibilityResult.riskAssessmentStatus).toBe('assessed');
    expect(result.eligibilityResult.decisionReason).toMatch(/credit profile increases/i);
  });

  it('fails a mandatory eligibility check despite favourable credit information', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      personalInfo: {
        age: 17,
        employmentStatus: 'employed',
        employmentDuration: 24,
      },
      financialInfo: {
        monthlyIncome: 50000,
        monthlyExpenses: 5000,
        existingDebt: 500,
        creditScore: 800,
      },
      loanDetails: {
        requestedAmount: 20000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toMatch(/age/i);
    expect(result.eligibilityResult.decisionReason).not.toMatch(/support the proposed/i);
    expect(result.eligibilityResult.approvalLikelihood).toBeNull();
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

  it('uses requested amount for loan-to-annual-income ratio even without a recommendation', () => {
    const eligible = scoreEligibility(screenshotRequest());
    const ineligible = scoreEligibility({
      ...screenshotRequest(),
      personalInfo: {
        ...screenshotRequest().personalInfo,
        age: 17,
      },
    });

    expect(eligible.affordabilityAnalysis.loanToIncomeRatio).toBe(16.67);
    expect(ineligible.recommendedLoan.recommendedAmount).toBe(0);
    expect(ineligible.affordabilityAnalysis.loanToIncomeRatio).toBe(16.67);
  });

  it('returns null loan-to-income ratio when monthly income cannot support the calculation', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        existingDebt: 0,
      },
      loanDetails: {
        requestedAmount: 10000,
        loanTerm: 12,
        loanPurpose: 'home_improvement',
      },
    });

    expect(result.affordabilityAnalysis.loanToIncomeRatio).toBeNull();
    expect(Number.isFinite(result.affordabilityAnalysis.debtToIncomeRatio)).toBe(true);
    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBe(100);
  });

  it('uses a supportive decision reason when eligible with medium risk and good affordability', () => {
    const result = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        monthlyIncome: 50000,
        monthlyExpenses: 5000,
        existingDebt: 500,
        creditScore: 520,
      },
      loanDetails: {
        requestedAmount: 20000,
        loanTerm: 24,
        loanPurpose: 'home_improvement',
      },
    });

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.affordabilityAnalysis.affordabilityScore).toBe('good');
    expect(result.eligibilityResult.riskCategory).toBe('medium');
    expect(result.eligibilityResult.decisionReason).toBe(
      'You meet the initial eligibility criteria. Your available monthly income supports the proposed repayment.',
    );
  });

  it('classifies credit risk at the validation min boundary', () => {
    const high = scoreEligibility({
      ...requestForRiskCell(CREDIT_SCORE_MIN, 'good'),
    });
    const medium = scoreEligibility({
      ...requestForRiskCell(CREDIT_SCORE_MIN + 1, 'good'),
    });

    expect(high.eligibilityResult.riskCategory).toBe('high');
    expect(medium.eligibilityResult.riskCategory).toBe('medium');
  });

  it('rates affordability at the documented DTI boundaries', () => {
    const goodEdge = scoreEligibility({
      ...baseRequest(),
      financialInfo: {
        monthlyIncome: 100000,
        monthlyExpenses: 1000,
        existingDebt: 0,
        creditScore: 800,
      },
      loanDetails: {
        requestedAmount: 5000,
        loanTerm: 60,
        loanPurpose: 'home_improvement',
      },
    });
    expect(goodEdge.affordabilityAnalysis.debtToIncomeRatio).toBeLessThanOrEqual(
      AFFORDABILITY_DTI_GOOD_MAX,
    );
    expect(goodEdge.affordabilityAnalysis.affordabilityScore).toBe('good');

    // Force DTI just above good max via existing debt with tiny loan.
    const fairEdge = scoreEligibility({
      personalInfo: baseRequest().personalInfo,
      financialInfo: {
        monthlyIncome: 10000,
        monthlyExpenses: 500,
        existingDebt: 3000,
        creditScore: 800,
      },
      loanDetails: {
        requestedAmount: 5000,
        loanTerm: 60,
        loanPurpose: 'home_improvement',
      },
    });
    expect(fairEdge.affordabilityAnalysis.debtToIncomeRatio).toBeGreaterThan(
      AFFORDABILITY_DTI_GOOD_MAX,
    );
    expect(fairEdge.affordabilityAnalysis.debtToIncomeRatio).toBeLessThanOrEqual(
      AFFORDABILITY_DTI_FAIR_MAX,
    );
    expect(fairEdge.affordabilityAnalysis.affordabilityScore).toBe('fair');
  });

  describe('simulated approval estimate', () => {
    it('applies the documented credit-score-only rule from validation min', () => {
      expect(simulatedApprovalEstimate(CREDIT_SCORE_MIN)).toBe(55);
      expect(simulatedApprovalEstimate(CREDIT_SCORE_MIN + 1)).toBe(70);
      expect(simulatedApprovalEstimate(520)).toBe(70);
      expect(simulatedApprovalEstimate(780)).toBe(70);
    });

    it('returns the stepped estimate for valid eligible scores and never decreases as score improves', () => {
      const poor = scoreEligibility({
        ...baseRequest(),
        financialInfo: { ...baseRequest().financialInfo, creditScore: CREDIT_SCORE_MIN },
      });
      const good = scoreEligibility({
        ...baseRequest(),
        financialInfo: { ...baseRequest().financialInfo, creditScore: 520 },
      });

      expect(poor.eligibilityResult.approvalLikelihood).toBe(55);
      expect(good.eligibilityResult.approvalLikelihood).toBe(70);
      expect(good.eligibilityResult.approvalLikelihood as number).toBeGreaterThan(
        poor.eligibilityResult.approvalLikelihood as number,
      );
    });

    it('returns null approval estimate for missing, failed, invalid, and ineligible cases', () => {
      const missing = scoreEligibility(baseRequest());
      const failed = scoreEligibility({
        ...baseRequest(),
        financialInfo: {
          ...baseRequest().financialInfo,
          creditCheckFailed: true,
        },
      });
      const invalid = scoreEligibility({
        ...baseRequest(),
        financialInfo: {
          ...baseRequest().financialInfo,
          creditScore: 900,
        },
      });
      const ineligible = scoreEligibility({
        ...baseRequest(),
        personalInfo: { ...baseRequest().personalInfo, age: 17 },
        financialInfo: {
          ...baseRequest().financialInfo,
          creditScore: 520,
        },
      });

      expect(missing.eligibilityResult.approvalLikelihood).toBeNull();
      expect(failed.eligibilityResult.approvalLikelihood).toBeNull();
      expect(invalid.eligibilityResult.approvalLikelihood).toBeNull();
      expect(ineligible.eligibilityResult.approvalLikelihood).toBeNull();
    });
  });

  describe('overall risk decision table', () => {
    const expected: Record<RiskCategory, Record<'good' | 'fair' | 'poor', RiskCategory>> = {
      low: { good: 'low', fair: 'medium', poor: 'high' },
      medium: { good: 'medium', fair: 'medium', poor: 'high' },
      high: { good: 'high', fair: 'high', poor: 'high' },
    };

    /** Score-derived credit risk only yields medium or high; low row is matrix-only. */
    const creditScores: Record<'medium' | 'high', number> = {
      medium: 520,
      high: CREDIT_SCORE_MIN,
    };

    (['low', 'medium', 'high'] as const).forEach((creditRisk) => {
      (['good', 'fair', 'poor'] as const).forEach((affordability) => {
        it(`maps credit ${creditRisk} × affordability ${affordability} to ${expected[creditRisk][affordability]}`, () => {
          expect(overallRiskFromCreditAndAffordability(creditRisk, affordability)).toBe(
            expected[creditRisk][affordability],
          );

          if (creditRisk === 'low') {
            return;
          }

          const request = requestForRiskCell(creditScores[creditRisk], affordability);
          const result = scoreEligibility(request);

          expect(result.eligibilityResult.isEligible).toBe(true);
          expect(result.affordabilityAnalysis.affordabilityScore).toBe(affordability);
          expect(result.eligibilityResult.riskAssessmentStatus).toBe('assessed');
          expect(result.eligibilityResult.riskCategory).not.toBeNull();
          expect(result.eligibilityResult.riskCategory).toBe(expected[creditRisk][affordability]);
        });
      });
    });
  });

  it('keeps displayed repayment aligned with the payment used in DTI', () => {
    const result = scoreEligibility(screenshotRequest());
    const payment = result.recommendedLoan.monthlyPayment;
    const expectedDti = Math.round(((10000 + payment) / 30000) * 100 * 100) / 100;

    expect(result.affordabilityAnalysis.debtToIncomeRatio).toBe(expectedDti);
  });
});
