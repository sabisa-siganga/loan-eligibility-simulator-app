import type { LoanProduct } from '../../types/api';

/**
 * Static mock loan catalog returned by the products Mock Service Worker handler.
 * Amount/term bounds and purpose lists drive validation rules and eligibility.
 */
export const MOCK_PRODUCTS: readonly LoanProduct[] = [
  /**
   * Personal loan: mid-range amounts, shorter maximum term, broad purpose list.
   */
  {
    id: 'personal_loan',
    name: 'Personal Loan',
    description: 'Flexible personal financing for various needs',
    minAmount: 5000,
    maxAmount: 300000,
    minTerm: 6,
    maxTerm: 60,
    interestRateRange: {
      min: 10.5,
      max: 18.5,
    },
    purposes: ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other'],
  },
  /**
   * Vehicle finance: higher amounts, longer terms, vehicle-only purposes.
   */
  {
    id: 'vehicle_loan',
    name: 'Vehicle Finance',
    description: 'Financing for new and used vehicles',
    minAmount: 50000,
    maxAmount: 1500000,
    minTerm: 12,
    maxTerm: 72,
    interestRateRange: {
      min: 8.5,
      max: 15.0,
    },
    purposes: ['new_vehicle', 'used_vehicle'],
  },
];
