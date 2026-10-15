import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

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
  type LoanDetailsFormParsedValues,
  type LoanDetailsFormValues,
} from '../../utils/buildFormSchemas';
import { formatMoney, formatMoneyRange } from '../../utils/formatMoney';
import { getPurposeLabel } from '../../utils/purposeLabels';
import styles from './LoanDetailsScreen.module.scss';

const PURPOSE_GROUP_NAME = 'loan-purpose';

const FIELD_ORDER: (keyof LoanDetailsFormValues)[] = ['purpose', 'amount', 'termMonths'];

const draftNumberToText = (value: number | null): string => (value === null ? '' : String(value));

const textToDraftNumber = (value: string): number | null => {
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
  const pendingPurposeFocusRef = useRef(false);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    () => journey.selectedProductId ?? products[0]?.id ?? null,
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === journey.selectedProductId) ?? null,
    [products, journey.selectedProductId],
  );

  const schemaProduct = useMemo(() => {
    if (selectedProduct) {
      return selectedProduct;
    }
    return products.find((product) => product.id === expandedProductId) ?? products[0] ?? null;
  }, [expandedProductId, products, selectedProduct]);

  const schema = useMemo(
    () =>
      validationRules && schemaProduct
        ? buildLoanDetailsSchema({ rules: validationRules, product: schemaProduct })
        : null,
    [schemaProduct, validationRules],
  );

  const defaultValues = useMemo<LoanDetailsFormValues>(
    () => ({
      purpose: journey.selectedPurpose ?? '',
      amount: draftNumberToText(journey.loanAmount),
      termMonths: draftNumberToText(journey.loanTerm),
    }),
    [journey.loanAmount, journey.loanTerm, journey.selectedPurpose],
  );

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isSubmitted, touchedFields },
  } = useForm<LoanDetailsFormValues, unknown, LoanDetailsFormParsedValues>({
    resolver: schema
      ? (zodResolver(schema) as Resolver<
          LoanDetailsFormValues,
          unknown,
          LoanDetailsFormParsedValues
        >)
      : undefined,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const watchedValues = watch();

  useEffect(() => {
    if (expandedProductId !== null || journey.selectedProductId !== null) {
      return;
    }
    const firstProductId = products[0]?.id ?? null;
    if (firstProductId !== null) {
      setExpandedProductId(firstProductId);
    }
  }, [expandedProductId, journey.selectedProductId, products]);

  useEffect(() => {
    const nextAmount = textToDraftNumber(watchedValues.amount);
    const nextTerm = textToDraftNumber(watchedValues.termMonths);

    if (nextAmount !== journey.loanAmount) {
      dispatch(setLoanAmount(nextAmount));
    }
    if (nextTerm !== journey.loanTerm) {
      dispatch(setLoanTerm(nextTerm));
    }
  }, [
    dispatch,
    journey.loanAmount,
    journey.loanTerm,
    watchedValues.amount,
    watchedValues.termMonths,
  ]);

  useEffect(() => {
    if (!pendingPurposeFocusRef.current || !expandedProductId) {
      return;
    }

    pendingPurposeFocusRef.current = false;
    const firstPurpose = document.querySelector<HTMLInputElement>(
      `input[name="${PURPOSE_GROUP_NAME}"]`,
    );
    firstPurpose?.focus();
  }, [expandedProductId, errors.purpose, isSubmitted]);

  if (!validationRules) {
    return null;
  }

  const showFieldError = (field: keyof LoanDetailsFormValues): string | undefined => {
    if (!(isSubmitted || touchedFields[field])) {
      return undefined;
    }
    return errors[field]?.message;
  };

  const focusFirstInvalid = (
    fieldErrors: Partial<Record<keyof LoanDetailsFormValues, unknown>>,
  ) => {
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid === 'purpose') {
      const firstPurpose = document.querySelector<HTMLInputElement>(
        `input[name="${PURPOSE_GROUP_NAME}"]`,
      );
      firstPurpose?.focus();
      return;
    }
    if (firstInvalid === 'amount') {
      document.getElementById('loan-amount')?.focus();
      return;
    }
    if (firstInvalid === 'termMonths') {
      document.getElementById('loan-term')?.focus();
    }
  };

  const handleProductExpand = (productId: string) => {
    if (expandedProductId === productId) {
      return;
    }

    if (expandedProductId !== null || journey.selectedProductId !== null) {
      dispatch(clearLoanSelection());
      reset({
        purpose: '',
        amount: '',
        termMonths: '',
      });
    }

    setExpandedProductId(productId);
  };

  const handlePurposeSelect = (productId: string, purposeId: string) => {
    const productChanged = journey.selectedProductId !== productId;
    setValue('purpose', purposeId, { shouldTouch: true, shouldValidate: true });
    dispatch(selectPurpose({ productId, purposeId }));

    if (productChanged) {
      setValue('amount', '', { shouldTouch: false });
      setValue('termMonths', '', { shouldTouch: false });
    }
  };

  const onValidSubmit = () => {
    dispatch(setCurrentScreen('yourBudget'));
  };

  const onInvalidSubmit = (fieldErrors: Partial<Record<keyof LoanDetailsFormValues, unknown>>) => {
    if (fieldErrors.purpose) {
      const nextExpanded = expandedProductId ?? products[0]?.id ?? null;
      if (nextExpanded !== null && nextExpanded !== expandedProductId) {
        pendingPurposeFocusRef.current = true;
        setExpandedProductId(nextExpanded);
        return;
      }
    }
    focusFirstInvalid(fieldErrors);
  };

  const handlePrimaryAction = handleSubmit(onValidSubmit, onInvalidSubmit);

  const productLabel = selectedProduct?.name ?? 'Not selected';
  const purposeLabel = journey.selectedPurpose
    ? getPurposeLabel(journey.selectedPurpose)
    : 'Not selected';
  const amountLabel = journey.loanAmount === null ? 'Not entered' : formatMoney(journey.loanAmount);
  const termLabel = journey.loanTerm === null ? 'Not entered' : `${journey.loanTerm} months`;
  const purposeError = showFieldError('purpose');

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
                amountText={watchedValues.amount}
                termText={watchedValues.termMonths}
                amountHelperText={`How much do you need? Allowed: ${formatMoneyRange(amountBounds.min, amountBounds.max)}`}
                termHelperText={`How long to repay? Allowed: ${termBounds.min} to ${termBounds.max} months`}
                amountError={isSelected ? showFieldError('amount') : undefined}
                termError={isSelected ? showFieldError('termMonths') : undefined}
                purposeError={isExpanded ? purposeError : undefined}
                onHeaderClick={() => {
                  handleProductExpand(product.id);
                }}
                onPurposeChange={(nextPurpose) => {
                  handlePurposeSelect(product.id, nextPurpose);
                }}
                onAmountChange={(value) => {
                  setValue('amount', value, {
                    shouldDirty: true,
                    shouldValidate: isSubmitted,
                  });
                }}
                onTermChange={(value) => {
                  setValue('termMonths', value, {
                    shouldDirty: true,
                    shouldValidate: isSubmitted,
                  });
                }}
                onAmountBlur={() => {
                  if (isSelected) {
                    setValue('amount', watchedValues.amount, { shouldTouch: true });
                    void trigger('amount');
                  }
                }}
                onTermBlur={() => {
                  if (isSelected) {
                    setValue('termMonths', watchedValues.termMonths, { shouldTouch: true });
                    void trigger('termMonths');
                  }
                }}
              />
            );
          })}

          {purposeError && !journey.selectedPurpose && expandedProductId === null ? (
            <ErrorText id={purposeErrorId}>{purposeError}</ErrorText>
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
