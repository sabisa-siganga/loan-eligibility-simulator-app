import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { JourneyLayout } from '../../components/journey-layout';
import { LoanProductSection } from '../../components/loan-product-section';
import { LoanSummaryPanel } from '../../components/loan-summary-panel';
import { ErrorText } from '../../components/ui';
import {
  clearLoanSelection,
  selectPurpose,
  setCurrentScreen,
  setLoanAmount,
  setLoanTerm,
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
  const purposeErrorId = useId();

  const [amountText, setAmountText] = useState(
    journey.loanAmount === null ? '' : String(journey.loanAmount),
  );
  const [termText, setTermText] = useState(
    journey.loanTerm === null ? '' : String(journey.loanTerm),
  );
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    () => journey.selectedProductId ?? null,
  );
  const [touched, setTouched] = useState({
    purpose: false,
    amount: false,
    term: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const pendingPurposeFocusRef = useRef(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === journey.selectedProductId) ?? null,
    [products, journey.selectedProductId],
  );

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
      creditScore: null,
    });

    if (parsed.success) {
      setFieldErrors({});
      return;
    }

    const nextErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = String(issue.path[0] ?? '');
      if (key && key !== 'creditScore' && !nextErrors[key]) {
        nextErrors[key] = issue.message;
      }
    });
    setFieldErrors(nextErrors);
  }, [amountText, journey.selectedPurpose, selectedProduct, termText, validationRules]);

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

  const showError = (field: 'purpose' | 'amount' | 'termMonths') => {
    const touchedKey = field === 'termMonths' ? 'term' : field;
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
  };

  const handlePurposeSelect = (productId: string, purposeId: string) => {
    const productChanged = journey.selectedProductId !== productId;
    dispatch(selectPurpose({ productId, purposeId }));
    setTouched((current) => ({ ...current, purpose: true }));

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
    const numeric = parseOptionalNumber(value);
    dispatch(setLoanAmount(numeric));
  };

  const handleTermChange = (value: string) => {
    setTermText(value);
    const numeric = parseOptionalNumber(value);
    dispatch(setLoanTerm(numeric));
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
    }
  };

  const handlePrimaryAction = () => {
    setSubmitAttempted(true);

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
      creditScore: null,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && key !== 'creditScore' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    dispatch(setCurrentScreen('yourBudget'));
  };

  const productLabel = selectedProduct?.name ?? 'Not selected';
  const purposeLabel = journey.selectedPurpose
    ? getPurposeLabel(journey.selectedPurpose)
    : 'Not selected';
  const amountLabel = journey.loanAmount === null ? 'Not entered' : formatMoney(journey.loanAmount);
  const termLabel = journey.loanTerm === null ? 'Not entered' : `${journey.loanTerm} months`;

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
        </div>

        <div className={styles.summary}>
          <LoanSummaryPanel
            productLabel={productLabel}
            purposeLabel={purposeLabel}
            amountLabel={amountLabel}
            termLabel={termLabel}
            onAction={handlePrimaryAction}
            disabled={products.length === 0}
          />
        </div>
      </div>
    </JourneyLayout>
  );
};

export default LoanDetailsScreen;
