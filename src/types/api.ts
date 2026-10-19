export type InterestRateRange = {
  min: number;
  max: number;
};

export type LoanProduct = {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  interestRateRange: InterestRateRange;
  purposes: string[];
};

export type ProductsResponse = {
  products: LoanProduct[];
};

export type FieldRule = {
  min?: number;
  max?: number;
  required?: boolean;
  options?: string[];
  errorMessage?: string;
};

export type LoanProductValidationRules = {
  requestedAmount: FieldRule;
  loanTerm: FieldRule;
};

export type ValidationRulesResponse = {
  personalInfo: {
    age: FieldRule;
    employmentStatus: FieldRule;
    employmentDuration: FieldRule;
  };
  financialInfo: {
    monthlyIncome: FieldRule;
    monthlyExpenses: FieldRule;
    creditScore: FieldRule;
  };
  loanDetails: Record<string, LoanProductValidationRules>;
};

export type CreditCheckState = 'bad' | 'good' | 'over_limit';

export type CreditCheckRequest = {
  readonly state: CreditCheckState;
};

export type CreditCheckResponse = {
  readonly creditScore: number;
};

export type CalculateRateRequest = {
  readonly loanAmount: number;
  readonly loanTerm: number;
  readonly loanType: string;
  readonly creditScore?: number;
};

export type PaymentScheduleEntry = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type CalculateRateResponse = {
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentScheduleEntry[];
};

export type RiskCategory = 'low' | 'medium' | 'high';

export type RiskAssessmentStatus =
  'assessed' | 'missing_credit_data' | 'credit_check_failed' | 'invalid_credit_response';

export type EligibilityRequest = {
  readonly personalInfo: {
    readonly age: number;
    readonly employmentStatus: string;
    readonly employmentDuration: number;
  };
  readonly financialInfo: {
    readonly monthlyIncome: number;
    readonly monthlyExpenses: number;
    readonly existingDebt: number;
    readonly creditScore?: number;
    /** True when the applicant opted in and the bureau check failed. */
    readonly creditCheckFailed?: boolean;
  };
  readonly loanDetails: {
    readonly requestedAmount: number;
    readonly loanTerm: number;
    readonly loanPurpose: string;
  };
};

export type EligibilityResponse = {
  readonly eligibilityResult: {
    readonly isEligible: boolean;
    /**
     * Simulated approval estimate (credit-score-only mock rule) when assessed
     * and eligible: below 650 → 55, 650–749 → 70, 750+ → 95. Null when missing,
     * failed, invalid, or mandatory eligibility checks fail.
     */
    readonly approvalLikelihood: number | null;
    /** Null when overall risk cannot be assessed (missing/failed/invalid credit). */
    readonly riskCategory: RiskCategory | null;
    readonly riskAssessmentStatus: RiskAssessmentStatus;
    readonly decisionReason: string;
  };
  readonly recommendedLoan: {
    readonly maxAmount: number;
    readonly recommendedAmount: number;
    readonly interestRate: number;
    readonly monthlyPayment: number;
    readonly totalRepayment: number;
  };
  readonly affordabilityAnalysis: {
    /** Remaining monthly income after the proposed repayment. */
    readonly disposableIncome: number;
    readonly debtToIncomeRatio: number;
    /** Requested loan ÷ annual take-home income × 100; null when uncalculable. */
    readonly loanToIncomeRatio: number | null;
    readonly affordabilityScore: string;
  };
};
