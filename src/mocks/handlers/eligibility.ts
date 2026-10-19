import { http, HttpResponse } from 'msw';

import { MOCK_ELIGIBILITY_FAIL_STORAGE_KEY } from '../constants';
import { scoreEligibility } from '../logic/scoreEligibility';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Narrow untrusted JSON to the shape `scoreEligibility` expects. */
const isEligibilityRequest = (value: unknown): value is Parameters<typeof scoreEligibility>[0] => {
  if (!isRecord(value)) {
    return false;
  }

  const personal = value.personalInfo;
  const financial = value.financialInfo;
  const loan = value.loanDetails;

  if (!isRecord(personal) || !isRecord(financial) || !isRecord(loan)) {
    return false;
  }

  return (
    typeof personal.age === 'number' &&
    typeof personal.employmentStatus === 'string' &&
    typeof personal.employmentDuration === 'number' &&
    typeof financial.monthlyIncome === 'number' &&
    typeof financial.monthlyExpenses === 'number' &&
    typeof financial.existingDebt === 'number' &&
    (financial.creditScore === undefined || typeof financial.creditScore === 'number') &&
    typeof loan.requestedAmount === 'number' &&
    typeof loan.loanTerm === 'number' &&
    typeof loan.loanPurpose === 'string'
  );
};

export const eligibilityHandlers = [
  http.post('*/api/loans/eligibility', async ({ request }) => {
    // Test/demo hook: force a 500 without changing scoring logic.
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(MOCK_ELIGIBILITY_FAIL_STORAGE_KEY) === '1'
    ) {
      return HttpResponse.json(
        { message: 'Eligibility check temporarily unavailable' },
        { status: 500 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    if (!isEligibilityRequest(body)) {
      return HttpResponse.json({ message: 'Invalid eligibility request' }, { status: 400 });
    }

    return HttpResponse.json(scoreEligibility(body));
  }),
];
