import { http, HttpResponse } from 'msw';

import { amortiseLoan, pickRatePercent } from '../logic/amortise';
import { MOCK_PRODUCTS } from '../data/products';

/** True when value is a non-null object (request body guard). */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Mock POST `/api/loans/calculate-rate`.
 * Validates body → rejects unknown product / bad creditScore → picks rate → amortises.
 */
export const calculateRateHandlers = [
  http.post('*/api/loans/calculate-rate', async ({ request }) => {
    let body: unknown;

    /** Parse the request body; malformed payload → 400. */
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    /** Non-object body → 400. */
    if (!isRecord(body)) {
      return HttpResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const loanAmount = body.loanAmount;
    const loanTerm = body.loanTerm;
    const loanType = body.loanType;
    const creditScore = body.creditScore;

    /**
     * Required loan fields: finite amount, integer term, string product identifier.
     * Missing or wrong types → 400.
     */
    if (
      typeof loanAmount !== 'number' ||
      !Number.isFinite(loanAmount) ||
      typeof loanTerm !== 'number' ||
      !Number.isInteger(loanTerm) ||
      typeof loanType !== 'string'
    ) {
      return HttpResponse.json({ message: 'Missing required loan fields' }, { status: 400 });
    }

    /** loanType must match a catalog product identifier. */
    const productExists = MOCK_PRODUCTS.some((product) => product.id === loanType);
    if (!productExists) {
      return HttpResponse.json({ message: 'Unknown loan type' }, { status: 400 });
    }

    /** Optional creditScore must be a number when present. */
    if (creditScore !== undefined && typeof creditScore !== 'number') {
      return HttpResponse.json({ message: 'Invalid credit score' }, { status: 400 });
    }

    /** Map credit score onto the product rate band (midpoint if omitted). */
    const interestRate = pickRatePercent({
      loanType,
      creditScore: typeof creditScore === 'number' ? creditScore : undefined,
    });

    /** Success: amortised quote for principal, term, and chosen rate. */
    return HttpResponse.json(
      amortiseLoan({
        principal: loanAmount,
        termMonths: loanTerm,
        annualRatePercent: interestRate,
      }),
    );
  }),
];
