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

/** Shared name so purpose radios across product sections form one group. */
const PURPOSE_GROUP_NAME = 'loan-purpose';

/** Focus order used after failed submit — purpose radios share one group name. */
const FIELD_ORDER: (keyof LoanDetailsFormValues)[] = ['purpose', 'amount', 'termMonths'];

/** Convert a Redux draft number to an React Hook Form string field; null becomes empty. */
const draftNumberToText = (value: number | null): string => (value === null ? '' : String(value));

/**
 * Parse an React Hook Form string field back to a draft number.
 * Empty/whitespace → null; non-finite → null.
 */
const textToDraftNumber = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Step 1: pick product/purpose and amount/term.
 * Form strings stay local to React Hook Form; amount/term are mirrored into Redux so the
 * summary panel and later steps read from the journey draft.
 */
export const LoanDetailsScreen = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.catalog.products);
  const validationRules = useAppSelector((state) => state.catalog.validationRules);
  const journey = useAppSelector((state) => state.journey);
  const purposeErrorId = useId();
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  /** Set when submit fails on purpose and the accordion must expand before focus. */
  const pendingPurposeFocusRef = useRef(false);
  /** Ensures the page title receives focus only once on mount. */
  const hasFocusedTitleRef = useRef(false);

  /** Accordion open state: journey selection, else first catalog product. */
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    () => journey.selectedProductId ?? products[0]?.id ?? null,
  );

  /** Product currently selected in the journey, if any. */
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === journey.selectedProductId) ?? null,
    [products, journey.selectedProductId],
  );

  /**
   * Schema needs a product even before a purpose is chosen — use the expanded
   * accordion (or first catalog entry) so amount/term bounds still validate.
   */
  const schemaProduct = useMemo(() => {
    if (selectedProduct) {
      return selectedProduct;
    }
    return products.find((product) => product.id === expandedProductId) ?? products[0] ?? null;
  }, [expandedProductId, products, selectedProduct]);

  /** Zod schema when catalog rules and a product are both available; else null. */
  const schema = useMemo(
    () =>
      validationRules && schemaProduct
        ? buildLoanDetailsSchema({ rules: validationRules, product: schemaProduct })
        : null,
    [schemaProduct, validationRules],
  );

  /** Seed React Hook Form from the persisted journey draft (null numbers → empty strings). */
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

  /** If nothing is expanded or selected yet, open the first catalog product. */
  useEffect(() => {
    if (expandedProductId !== null || journey.selectedProductId !== null) {
      return;
    }
    const firstProductId = products[0]?.id ?? null;
    if (firstProductId !== null) {
      setExpandedProductId(firstProductId);
    }
  }, [expandedProductId, journey.selectedProductId, products]);

  /**
   * Keep Redux draft in sync on every keystroke so navigation away does not
   * lose partial amount/term values (session persistence reads journey state).
   */
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

  /** After expanding a product to fix a purpose error, move focus once the radios mount. */
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

  /** Move keyboard focus to the screen title once on first mount. */
  useEffect(() => {
    if (hasFocusedTitleRef.current) {
      return;
    }
    hasFocusedTitleRef.current = true;
    titleRef.current?.focus();
  }, []);

  /** Catalog rules are required before the form can render. */
  if (!validationRules) {
    return null;
  }

  /** Show an error only after submit or when that field has been touched. */
  const showFieldError = (field: keyof LoanDetailsFormValues): string | undefined => {
    if (!(isSubmitted || touchedFields[field])) {
      return undefined;
    }
    return errors[field]?.message;
  };

  /** Focus the first invalid field in FIELD_ORDER (purpose → amount → term). */
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

  /**
   * Switching product clears selection — amount/term bounds belong to one product.
   * No-op when the same accordion header is clicked again.
   */
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

  /**
   * Select a purpose for a product; clear amount/term when the product changes
   * so bounds from the previous product do not linger.
   */
  const handlePurposeSelect = (productId: string, purposeId: string) => {
    const productChanged = journey.selectedProductId !== productId;
    setValue('purpose', purposeId, { shouldTouch: true, shouldValidate: true });
    dispatch(selectPurpose({ productId, purposeId }));

    if (productChanged) {
      setValue('amount', '', { shouldTouch: false });
      setValue('termMonths', '', { shouldTouch: false });
    }
  };

  /** Valid form → advance to the budget/details step. */
  const onValidSubmit = () => {
    dispatch(setCurrentScreen('yourBudget'));
  };

  /**
   * Invalid form: if purpose failed and no section is expanded, expand first
   * (or the first product) and defer focus; otherwise focus the first invalid field.
   */
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

  /** Summary panel labels: placeholders until the user has filled each field. */
  const productLabel = selectedProduct?.name ?? 'Choose a product';
  const purposeLabel = journey.selectedPurpose
    ? getPurposeLabel(journey.selectedPurpose)
    : 'Choose a purpose';
  const amountLabel =
    journey.loanAmount === null ? 'Enter amount' : formatMoney(journey.loanAmount);
  const termLabel = journey.loanTerm === null ? 'Enter term' : `${journey.loanTerm} months`;
  const purposeError = showFieldError('purpose');

  return (
    <JourneyLayout currentStepId="loanDetails">
      <form
        className={styles.layout}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handlePrimaryAction();
        }}
      >
        {/* Main column: intro, empty-catalog notice, product accordions */}
        <div className={[styles.main, styles.formColumn].join(' ')}>
          {/* Screen intro and required-field note */}
          <div className={styles.intro}>
            <h1 ref={titleRef} id={titleId} className={styles.title} tabIndex={-1}>
              Choose your loan
            </h1>
            <p className={styles.description}>
              Select a loan type, tell us what it&apos;s for and enter your amount and term.
            </p>
            <p className={styles.requiredNote}>
              Required fields are marked with an asterisk (<span aria-hidden="true">*</span>
              ).
            </p>
          </div>

          {/* Shown when the catalog loaded successfully but has no products */}
          {products.length === 0 ? (
            <p className={styles.errorBanner} role="status">
              No loan products are available right now.
            </p>
          ) : null}

          {/* One accordion section per product with purpose/amount/term when expanded */}
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

          {/* Fallback purpose error when no accordion is open to host the inline message */}
          {purposeError && !journey.selectedPurpose && expandedProductId === null ? (
            <ErrorText id={purposeErrorId}>{purposeError}</ErrorText>
          ) : null}
        </div>

        {/* Sticky summary + continue call to action; disabled when the catalog is empty */}
        <div className={styles.summary}>
          <LoanSummaryPanel
            productLabel={productLabel}
            purposeLabel={purposeLabel}
            amountLabel={amountLabel}
            termLabel={termLabel}
            actionType="submit"
            disabled={products.length === 0}
          />
        </div>
      </form>
    </JourneyLayout>
  );
};

export default LoanDetailsScreen;
