/**
 * Minimum/maximum interest rate band advertised for a loan product.
 */
export type InterestRateRange = {
  min: number;
  max: number;
};

/**
 * Catalog entry for a loan product returned by GET /loans/products.
 */
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

/**
 * Response body for the products catalog endpoint.
 */
export type ProductsResponse = {
  products: LoanProduct[];
};

/**
 * Optional bounds and messaging for a single form field from validation-rules.
 */
export type FieldRule = {
  min?: number;
  max?: number;
  required?: boolean;
  options?: string[];
  errorMessage?: string;
};

/**
 * Amount and term field rules for one product under loanDetails.
 */
export type LoanProductValidationRules = {
  requestedAmount: FieldRule;
  loanTerm: FieldRule;
};

/**
 * Response body for GET /loans/validation-rules.
 *
 * personalInfo and financialInfo drive budget/details validation;
 * loanDetails is keyed by product identifier.
 */
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

/**
 * Mock bureau path selector for the simulated credit check.
 */
export type CreditCheckState = 'bad' | 'good' | 'over_limit';

/**
 * Optional request body for POST /loans/credit-check.
 */
export type CreditCheckRequest = {
  readonly state: CreditCheckState;
};

/**
 * Response body for a successful credit check (finite score).
 */
export type CreditCheckResponse = {
  readonly creditScore: number;
};

/**
 * Request body for POST /loans/calculate-rate.
 *
 * creditScore is optional when the applicant continues without a score.
 */
export type CalculateRateRequest = {
  readonly loanAmount: number;
  readonly loanTerm: number;
  readonly loanType: string;
  readonly creditScore?: number;
};

/**
 * One month in the amortisation schedule returned with a rate quote.
 */
export type PaymentScheduleEntry = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

/**
 * Response body for a successful calculate-rate quote.
 */
export type CalculateRateResponse = {
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentScheduleEntry[];
};

/**
 * Overall risk band when credit data is available and assessed.
 */
export type RiskCategory = 'low' | 'medium' | 'high';

/**
 * Why risk was or was not fully assessed on an eligibility response.
 */
export type RiskAssessmentStatus =
  'assessed' | 'missing_credit_data' | 'credit_check_failed' | 'invalid_credit_response';

/**
 * Request body for POST /loans/eligibility.
 */
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

/**
 * Response body for a successful eligibility check.
 */
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
