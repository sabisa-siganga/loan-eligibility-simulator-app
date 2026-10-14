export type InterestRateRange = {
  readonly min: number;
  readonly max: number;
};

export type LoanProduct = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly minAmount: number;
  readonly maxAmount: number;
  readonly minTerm: number;
  readonly maxTerm: number;
  readonly interestRateRange: InterestRateRange;
  readonly purposes: readonly string[];
};

export type ProductsResponse = {
  readonly products: readonly LoanProduct[];
};

export type FieldRule = {
  readonly min?: number;
  readonly max?: number;
  readonly required?: boolean;
  readonly options?: readonly string[];
  readonly errorMessage?: string;
};

export type ValidationRulesResponse = {
  readonly personalInfo: {
    readonly age: FieldRule;
    readonly employmentStatus: FieldRule;
    readonly employmentDuration: FieldRule;
  };
  readonly financialInfo: {
    readonly monthlyIncome: FieldRule;
    readonly monthlyExpenses: FieldRule;
    readonly creditScore: FieldRule;
  };
  readonly loanDetails: {
    readonly requestedAmount: FieldRule;
    readonly loanTerm: FieldRule;
  };
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
  readonly month: number;
  readonly payment: number;
  readonly principal: number;
  readonly interest: number;
  readonly balance: number;
};

export type CalculateRateResponse = {
  readonly interestRate: number;
  readonly monthlyPayment: number;
  readonly totalInterest: number;
  readonly totalRepayment: number;
  readonly paymentSchedule: readonly PaymentScheduleEntry[];
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
