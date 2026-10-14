import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { JourneyLayout } from '../../components/journey-layout';
import { LoanProductSection } from '../../components/loan-product-section';
import { LoanSummaryPanel } from '../../components/loan-summary-panel';
import { Button, ErrorText, HelperText } from '../../components/ui';
import { WholeNumberInput } from '../../components/whole-number-input';
import { calculateRate } from '../../services/calculateRate';
import { runCreditCheck } from '../../services/creditCheck';
import {
  clearLoanSelection,
  selectPrimaryActionMode,
  selectPurpose,
  setCreditCheckScore,
  setCurrentScreen,
  setLoanAmount,
  setLoanTerm,
  setManualCreditScore,
  setRateQuote,
  useAppDispatch,
  useAppSelector,
} from '../../store';
import {
  buildLoanDetailsSchema,
  getProductAmountBounds,
  getProductTermBounds,
} from '../../utils/buildFormSchemas';
import { formatMoney, formatMoneyRange } from '../../utils/formatMoney';
import { getPurposeLabel } from '../../utils/purposeLabels';
import { resolveEffectiveCreditScore } from '../../utils/resolveEffectiveCreditScore';
import styles from './LoanDetailsScreen.module.scss';

const PURPOSE_GROUP_NAME = 'loan-purpose';

const parseOptionalNumber = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const LoanDetailsScreen = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.catalog.products);
  const validationRules = useAppSelector((state) => state.catalog.validationRules);
  const journey = useAppSelector((state) => state.journey);
  const actionMode = useAppSelector(selectPrimaryActionMode);
  const purposeErrorId = useId();

  const [amountText, setAmountText] = useState(
    journey.loanAmount === null ? '' : String(journey.loanAmount),
  );
  const [termText, setTermText] = useState(
    journey.loanTerm === null ? '' : String(journey.loanTerm),
  );
  const [creditText, setCreditText] = useState(
    journey.manualCreditScore === null ? '' : String(journey.manualCreditScore),
  );
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    () => journey.selectedProductId ?? products[0]?.id ?? null,
  );
  const [touched, setTouched] = useState({
    purpose: false,
    amount: false,
    term: false,
    creditScore: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const [creditCheckError, setCreditCheckError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCheckingCredit, setIsCheckingCredit] = useState(false);

  const calculateGenerationRef = useRef(0);
  const calculateControllerRef = useRef<AbortController | null>(null);
  const creditControllerRef = useRef<AbortController | null>(null);
  const pendingPurposeFocusRef = useRef(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === journey.selectedProductId) ?? null,
    [products, journey.selectedProductId],
  );

  const effectiveCreditScore = resolveEffectiveCreditScore({
    entered: parseOptionalNumber(creditText),
    creditCheckScore: journey.creditCheckScore,
  });

  useEffect(() => {
    if (!validationRules || !selectedProduct) {
      return;
    }

    const schema = buildLoanDetailsSchema({
      rules: validationRules,
      product: selectedProduct,
    });
    const parsed = schema.safeParse({
      purpose: journey.selectedPurpose ?? '',
      amount: parseOptionalNumber(amountText),
      termMonths: parseOptionalNumber(termText),
      creditScore: parseOptionalNumber(creditText),
    });

    if (parsed.success) {
      setFieldErrors({});
      return;
    }

    const nextErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = String(issue.path[0] ?? '');
      if (key && !nextErrors[key]) {
        nextErrors[key] = issue.message;
      }
    });
    setFieldErrors(nextErrors);
  }, [amountText, creditText, journey.selectedPurpose, selectedProduct, termText, validationRules]);

  useEffect(
    () => () => {
      calculateControllerRef.current?.abort();
      creditControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!pendingPurposeFocusRef.current || !expandedProductId) {
      return;
    }

    pendingPurposeFocusRef.current = false;
    const firstPurpose = document.querySelector<HTMLInputElement>(
      `input[name="${PURPOSE_GROUP_NAME}"]`,
    );
    firstPurpose?.focus();
  }, [expandedProductId, fieldErrors.purpose, submitAttempted]);

  if (!validationRules) {
    return null;
  }

  const showError = (field: 'purpose' | 'amount' | 'termMonths' | 'creditScore') => {
    const touchedKey =
      field === 'termMonths' ? 'term' : field === 'creditScore' ? 'creditScore' : field;
    return (submitAttempted || touched[touchedKey]) && Boolean(fieldErrors[field]);
  };

  const handleProductExpand = (productId: string) => {
    if (expandedProductId === productId) {
      return;
    }

    if (expandedProductId !== null || journey.selectedProductId !== null) {
      dispatch(clearLoanSelection());
      setAmountText('');
      setTermText('');
      setTouched((current) => ({
        ...current,
        purpose: false,
        amount: false,
        term: false,
      }));
    }

    setExpandedProductId(productId);
    setCalculateError(null);
  };

  const handlePurposeSelect = (productId: string, purposeId: string) => {
    const productChanged = journey.selectedProductId !== productId;
    dispatch(selectPurpose({ productId, purposeId }));
    setTouched((current) => ({ ...current, purpose: true }));
    setCalculateError(null);

    if (productChanged) {
      setAmountText('');
      setTermText('');
      setTouched((current) => ({
        ...current,
        purpose: true,
        amount: false,
        term: false,
      }));
    }
  };

  const handleAmountChange = (value: string) => {
    setAmountText(value);
    setCalculateError(null);
    const numeric = parseOptionalNumber(value);
    dispatch(setLoanAmount(numeric));
  };

  const handleTermChange = (value: string) => {
    setTermText(value);
    setCalculateError(null);
    const numeric = parseOptionalNumber(value);
    dispatch(setLoanTerm(numeric));
  };

  const handleCreditChange = (value: string) => {
    setCreditText(value);
    setCalculateError(null);
    const numeric = parseOptionalNumber(value);
    dispatch(setManualCreditScore(numeric));
  };

  const focusFirstInvalid = (errors: Record<string, string>) => {
    if (errors.purpose) {
      const firstPurpose = document.querySelector<HTMLInputElement>(
        `input[name="${PURPOSE_GROUP_NAME}"]`,
      );
      firstPurpose?.focus();
      return;
    }
    if (errors.amount) {
      document.getElementById('loan-amount')?.focus();
      return;
    }
    if (errors.termMonths) {
      document.getElementById('loan-term')?.focus();
      return;
    }
    if (errors.creditScore) {
      document.getElementById('credit-score')?.focus();
    }
  };

  const handlePrimaryAction = async () => {
    if (actionMode === 'continue') {
      dispatch(setCurrentScreen('yourBudget'));
      return;
    }

    setSubmitAttempted(true);
    setCalculateError(null);

    if (!selectedProduct || !journey.selectedPurpose) {
      const nextExpanded = expandedProductId ?? products[0]?.id ?? null;
      setFieldErrors((current) => ({
        ...current,
        purpose: 'Select a loan purpose to continue.',
      }));
      if (nextExpanded !== expandedProductId) {
        pendingPurposeFocusRef.current = true;
        setExpandedProductId(nextExpanded);
      } else {
        focusFirstInvalid({ purpose: 'Select a loan purpose to continue.' });
      }
      return;
    }

    const schema = buildLoanDetailsSchema({
      rules: validationRules,
      product: selectedProduct,
    });
    const parsed = schema.safeParse({
      purpose: journey.selectedPurpose,
      amount: parseOptionalNumber(amountText),
      termMonths: parseOptionalNumber(termText),
      creditScore: parseOptionalNumber(creditText),
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    const amount = parsed.data.amount as number;
    const termMonths = parsed.data.termMonths as number;
    const manualScore = parsed.data.creditScore ?? null;
    const effectiveScore = resolveEffectiveCreditScore({
      entered: manualScore,
      creditCheckScore: journey.creditCheckScore,
    });

    calculateControllerRef.current?.abort();
    const controller = new AbortController();
    calculateControllerRef.current = controller;
    const generation = calculateGenerationRef.current + 1;
    calculateGenerationRef.current = generation;
    setIsCalculating(true);

    try {
      const requestBody =
        effectiveScore === undefined
          ? {
              loanAmount: amount,
              loanTerm: termMonths,
              loanType: selectedProduct.id,
            }
          : {
              loanAmount: amount,
              loanTerm: termMonths,
              loanType: selectedProduct.id,
              creditScore: effectiveScore,
            };

      const result = await calculateRate(requestBody, { signal: controller.signal });

      if (generation !== calculateGenerationRef.current) {
        return;
      }

      if (!result.ok) {
        setCalculateError(result.message);
        return;
      }

      dispatch(
        setRateQuote({
          quote: result.data,
          inputs: {
            loanType: selectedProduct.id,
            loanAmount: amount,
            loanTerm: termMonths,
            creditScore: effectiveScore ?? null,
          },
        }),
      );
      dispatch(setCurrentScreen('yourBudget'));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (generation === calculateGenerationRef.current) {
        setCalculateError('Unable to calculate repayment. Please try again.');
      }
    } finally {
      if (generation === calculateGenerationRef.current) {
        setIsCalculating(false);
      }
    }
  };

  const handleCreditCheck = async () => {
    setCreditCheckError(null);
    creditControllerRef.current?.abort();
    const controller = new AbortController();
    creditControllerRef.current = controller;
    setIsCheckingCredit(true);

    try {
      const result = await runCreditCheck({ signal: controller.signal });
      if (!result.ok) {
        setCreditCheckError(result.message);
        return;
      }
      dispatch(setCreditCheckScore(result.creditScore));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setCreditCheckError('Credit check failed. You can try again or continue without a score.');
    } finally {
      setIsCheckingCredit(false);
    }
  };

  const productLabel = selectedProduct?.name ?? 'Not selected';
  const purposeLabel = journey.selectedPurpose
    ? getPurposeLabel(journey.selectedPurpose)
    : 'Not selected';
  const amountLabel = journey.loanAmount === null ? 'Not entered' : formatMoney(journey.loanAmount);
  const termLabel = journey.loanTerm === null ? 'Not entered' : `${journey.loanTerm} months`;
  const creditScoreLabel =
    effectiveCreditScore === undefined ? 'Not provided' : String(effectiveCreditScore);

  const creditSourceMessage = (() => {
    const manual = parseOptionalNumber(creditText);
    if (manual !== null) {
      return `Using your entered score of ${manual}.`;
    }
    if (journey.creditCheckScore !== null) {
      return `Using credit-check score of ${journey.creditCheckScore}.`;
    }
    return 'No credit score will be sent with your calculation.';
  })();

  return (
    <JourneyLayout currentStepId="loanDetails">
      <div className={styles.layout}>
        <div className={[styles.main, styles.formColumn].join(' ')}>
          <div className={styles.intro}>
            <h1 className={styles.title}>Choose your loan</h1>
            <p className={styles.description}>
              Select a loan type, tell us what it&apos;s for and enter your amount and term.
            </p>
            <p className={styles.requiredNote}>
              Required fields are marked with an asterisk (<span aria-hidden="true">*</span>
              ).
            </p>
          </div>

          {products.length === 0 ? (
            <p className={styles.errorBanner} role="status">
              No loan products are available right now.
            </p>
          ) : null}

          {products.map((product) => {
            const isSelected = journey.selectedProductId === product.id;
            const isExpanded = expandedProductId === product.id;
            const amountBounds = getProductAmountBounds(validationRules, product);
            const termBounds = getProductTermBounds(validationRules, product);

            return (
              <LoanProductSection
                key={product.id}
                product={product}
                purposeGroupName={PURPOSE_GROUP_NAME}
                selectedPurposeId={isSelected ? journey.selectedPurpose : null}
                isExpanded={isExpanded}
                isSelected={isSelected}
                amountText={amountText}
                termText={termText}
                amountHelperText={`How much do you need? Allowed: ${formatMoneyRange(amountBounds.min, amountBounds.max)}`}
                termHelperText={`How long to repay? Allowed: ${termBounds.min} to ${termBounds.max} months`}
                amountError={isSelected && showError('amount') ? fieldErrors.amount : undefined}
                termError={
                  isSelected && showError('termMonths') ? fieldErrors.termMonths : undefined
                }
                purposeError={isExpanded && showError('purpose') ? fieldErrors.purpose : undefined}
                onHeaderClick={() => {
                  handleProductExpand(product.id);
                }}
                onPurposeChange={(nextPurpose) => {
                  handlePurposeSelect(product.id, nextPurpose);
                }}
                onAmountChange={handleAmountChange}
                onTermChange={handleTermChange}
                onAmountBlur={() => {
                  if (isSelected) {
                    setTouched((current) => ({ ...current, amount: true }));
                  }
                }}
                onTermBlur={() => {
                  if (isSelected) {
                    setTouched((current) => ({ ...current, term: true }));
                  }
                }}
              />
            );
          })}

          {showError('purpose') && !journey.selectedPurpose && expandedProductId === null ? (
            <ErrorText id={purposeErrorId}>{fieldErrors.purpose}</ErrorText>
          ) : null}

          <section className={styles.creditSection} aria-labelledby="credit-score-heading">
            <div className={styles.creditHeadingRow}>
              <h2 id="credit-score-heading" className={styles.creditHeading}>
                Credit score (optional)
              </h2>
              <span className={styles.creditHeadingRule} aria-hidden="true" />
            </div>
            <p className={styles.creditDescription}>
              A higher credit score may improve your chances of a better rate.
            </p>
            <div className={styles.creditControls}>
              <WholeNumberInput
                id="credit-score"
                label="Your credit score"
                value={creditText}
                onChange={handleCreditChange}
                onBlur={() => {
                  setTouched((current) => ({ ...current, creditScore: true }));
                }}
                placeholder="e.g. 650"
                helperText={`${validationRules.financialInfo.creditScore.min ?? 300} to ${
                  validationRules.financialInfo.creditScore.max ?? 850
                }`}
                error={showError('creditScore') ? fieldErrors.creditScore : undefined}
              />
              <div className={styles.creditAction}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void handleCreditCheck();
                  }}
                  disabled={isCheckingCredit}
                >
                  {isCheckingCredit ? 'Checking…' : 'Run a credit check'}
                </Button>
                <HelperText>You can continue without a credit score.</HelperText>
              </div>
            </div>
            <p className={styles.creditStatus} aria-live="polite">
              <span className={styles.creditStatusStrong}>{creditSourceMessage}</span>
              {journey.creditCheckScore !== null
                ? ` Credit check returned ${journey.creditCheckScore}.`
                : null}
            </p>
            {creditCheckError ? <ErrorText>{creditCheckError}</ErrorText> : null}
          </section>
        </div>

        <div className={styles.summary}>
          <LoanSummaryPanel
            productLabel={productLabel}
            purposeLabel={purposeLabel}
            amountLabel={amountLabel}
            termLabel={termLabel}
            creditScoreLabel={creditScoreLabel}
            actionMode={actionMode}
            isSubmitting={isCalculating}
            error={calculateError ?? undefined}
            onAction={() => {
              void handlePrimaryAction();
            }}
            disabled={products.length === 0}
          />
        </div>
      </div>
      <div className="visually-hidden" aria-live="polite">
        {isCalculating
          ? actionMode === 'recalculate'
            ? 'Recalculating repayment'
            : 'Calculating repayment'
          : null}
        {isCheckingCredit ? 'Checking credit score' : null}
      </div>
    </JourneyLayout>
  );
};

export default LoanDetailsScreen;
