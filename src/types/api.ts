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
    readonly approvalLikelihood: number;
    readonly riskCategory: string;
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
    readonly disposableIncome: number;
    readonly debtToIncomeRatio: number;
    readonly loanToIncomeRatio: number;
    readonly affordabilityScore: string;
  };
};
