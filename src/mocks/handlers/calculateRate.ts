import { http, HttpResponse } from 'msw';

import { amortiseLoan, pickRatePercent } from '../logic/amortise';
import { MOCK_PRODUCTS } from '../data/products';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const calculateRateHandlers = [
  http.post('*/api/loans/calculate-rate', async ({ request }) => {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    if (!isRecord(body)) {
      return HttpResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const loanAmount = body.loanAmount;
    const loanTerm = body.loanTerm;
    const loanType = body.loanType;
    const creditScore = body.creditScore;

    if (
      typeof loanAmount !== 'number' ||
      !Number.isFinite(loanAmount) ||
      typeof loanTerm !== 'number' ||
      !Number.isInteger(loanTerm) ||
      typeof loanType !== 'string'
    ) {
      return HttpResponse.json({ message: 'Missing required loan fields' }, { status: 400 });
    }

    const productExists = MOCK_PRODUCTS.some((product) => product.id === loanType);
    if (!productExists) {
      return HttpResponse.json({ message: 'Unknown loan type' }, { status: 400 });
    }

    if (creditScore !== undefined && typeof creditScore !== 'number') {
      return HttpResponse.json({ message: 'Invalid credit score' }, { status: 400 });
    }

    const interestRate = pickRatePercent({
      loanType,
      creditScore: typeof creditScore === 'number' ? creditScore : undefined,
    });

    return HttpResponse.json(
      amortiseLoan({
        principal: loanAmount,
        termMonths: loanTerm,
        annualRatePercent: interestRate,
      }),
    );
  }),
];
