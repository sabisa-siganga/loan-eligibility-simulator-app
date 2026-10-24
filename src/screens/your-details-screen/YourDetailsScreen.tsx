import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, User, Wallet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useStore } from 'react-redux';

import { FormSectionCard } from '../../components/form-section-card';
import { JourneyLayout } from '../../components/journey-layout';
import { MoneyInput } from '../../components/money-input';
import { WholeNumberInput } from '../../components/whole-number-input';
import { Button, Checkbox, ErrorText, SegmentedRadio, Select } from '../../components/ui';
import { runCreditCheck } from '../../services/creditCheck';
import { checkEligibility } from '../../services/eligibility';
import { isAbortError } from '../../services/httpResult';
import {
  selectDetailsPrimaryActionMode,
  selectEffectiveCreditScoreValue,
  selectJourney,
  setCreditCheckOptIn,
  setCreditCheckScore,
  setCreditCheckState,
  setCurrentScreen,
  setEligibilityResult,
  setFinancialDetails,
  setPersonalDetails,
  useAppDispatch,
  useAppSelector,
  type EligibilityInputs,
  type RootState,
} from '../../store';
import type { CreditCheckState } from '../../types/api';
import {
  buildBudgetSchema,
  type BudgetFormParsedValues,
  type BudgetFormValues,
} from '../../utils/buildFormSchemas';
import {
  getEmploymentStatusLabel,
  requiresEmploymentDuration,
} from '../../utils/employmentStatusLabels';
import { formatMoney } from '../../utils/formatMoney';
import styles from './YourDetailsScreen.module.scss';

/** Convert a Redux draft number to an React Hook Form string field; null becomes empty. */
const draftNumberToText = (value: number | null): string => (value === null ? '' : String(value));

/** Demo-only credit-check scenarios for the segmented control. */
const CREDIT_CHECK_SCENARIO_OPTIONS: ReadonlyArray<{
  value: CreditCheckState;
  label: string;
}> = [
  { value: 'bad', label: 'Poor credit' },
  { value: 'good', label: 'Good credit' },
  { value: 'over_limit', label: 'Score above supported range.' },
];

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

/** Focus order used after failed submit. */
const FIELD_ORDER: (keyof BudgetFormValues)[] = [
  'age',
  'employmentStatus',
  'employmentDuration',
  'monthlyIncome',
  'monthlyExpenses',
  'existingDebt',
];

/**
 * Step 2: personal + financial details, optional simulated credit check, then
 * eligibility. Draft fields sync to Redux continuously; submit uses store
 * snapshots so concurrent credit-scenario changes cannot race the call to action mode.
 */
export const YourDetailsScreen = () => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const journey = useAppSelector(selectJourney);
  const validationRules = useAppSelector((state) => state.catalog.validationRules);
  const detailsActionMode = useAppSelector(selectDetailsPrimaryActionMode);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Generation counter: discard responses from superseded submit attempts. */
  const requestGenerationRef = useRef(0);
  /** Guards against overlapping submits while an in-flight request is active. */
  const isSubmittingRef = useRef(false);
  /** Aborts the previous credit-check / eligibility request on re-submit or unmount. */
  const abortRef = useRef<AbortController | null>(null);
  /** Ensures the first field receives focus only once on mount. */
  const hasFocusedFirstFieldRef = useRef(false);

  /** Land on the first interactive control so titles stay out of the tab/focus path. */
  useEffect(() => {
    if (hasFocusedFirstFieldRef.current) {
      return;
    }
    hasFocusedFirstFieldRef.current = true;
    document.getElementById('age')?.focus();
  }, []);

  /** True when product, purpose, amount, and term are all set from step 1. */
  const hasLoanContext = [
    journey.selectedProductId,
    journey.selectedPurpose,
    journey.loanAmount,
    journey.loanTerm,
  ].every((value) => value !== null);

  /** Zod budget schema when catalog rules are loaded; else null. */
  const schema = useMemo(
    () => (validationRules ? buildBudgetSchema({ rules: validationRules }) : null),
    [validationRules],
  );

  /** Seed React Hook Form from the persisted personal/financial draft. */
  const defaultValues = useMemo<BudgetFormValues>(
    () => ({
      age: draftNumberToText(journey.personalDetails.age),
      employmentStatus: journey.personalDetails.employmentStatus ?? '',
      employmentDuration: draftNumberToText(journey.personalDetails.employmentDuration),
      monthlyIncome: draftNumberToText(journey.financialDetails.monthlyIncome),
      monthlyExpenses: draftNumberToText(journey.financialDetails.monthlyExpenses),
      existingDebt: draftNumberToText(journey.financialDetails.existingDebt),
    }),
    [journey.financialDetails, journey.personalDetails],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitted, touchedFields },
  } = useForm<BudgetFormValues, unknown, BudgetFormParsedValues>({
    resolver: schema
      ? (zodResolver(schema) as Resolver<BudgetFormValues, unknown, BudgetFormParsedValues>)
      : undefined,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const watchedValues = watch();
  const employmentStatus = watchedValues.employmentStatus;
  const showEmploymentDuration = requiresEmploymentDuration(employmentStatus);

  /**
   * Hide duration for unemployed/retired and clear leftover values so they
   * cannot fail validation or persist into the eligibility fingerprint.
   */
  useEffect(() => {
    if (requiresEmploymentDuration(employmentStatus)) {
      return;
    }
    if (watchedValues.employmentDuration === '') {
      return;
    }
    setValue('employmentDuration', '');
    clearErrors('employmentDuration');
  }, [clearErrors, employmentStatus, setValue, watchedValues.employmentDuration]);

  /**
   * Mirror form → Redux draft (same persistence pattern as the loan step).
   * Non-duration statuses store employmentDuration as 0 in the draft.
   */
  useEffect(() => {
    const status =
      watchedValues.employmentStatus.trim() === '' ? null : watchedValues.employmentStatus;
    const nextPersonal = {
      age: textToDraftNumber(watchedValues.age),
      employmentStatus: status,
      employmentDuration:
        status !== null && !requiresEmploymentDuration(status)
          ? 0
          : textToDraftNumber(watchedValues.employmentDuration),
    };
    const nextFinancial = {
      monthlyIncome: textToDraftNumber(watchedValues.monthlyIncome),
      monthlyExpenses: textToDraftNumber(watchedValues.monthlyExpenses),
      existingDebt: textToDraftNumber(watchedValues.existingDebt),
    };

    const personalChanged =
      nextPersonal.age !== journey.personalDetails.age ||
      nextPersonal.employmentStatus !== journey.personalDetails.employmentStatus ||
      nextPersonal.employmentDuration !== journey.personalDetails.employmentDuration;
    const financialChanged =
      nextFinancial.monthlyIncome !== journey.financialDetails.monthlyIncome ||
      nextFinancial.monthlyExpenses !== journey.financialDetails.monthlyExpenses ||
      nextFinancial.existingDebt !== journey.financialDetails.existingDebt;

    if (personalChanged) {
      dispatch(setPersonalDetails(nextPersonal));
    }
    if (financialChanged) {
      dispatch(setFinancialDetails(nextFinancial));
    }
  }, [
    dispatch,
    journey.financialDetails,
    journey.personalDetails,
    watchedValues.age,
    watchedValues.employmentDuration,
    watchedValues.employmentStatus,
    watchedValues.existingDebt,
    watchedValues.monthlyExpenses,
    watchedValues.monthlyIncome,
  ]);

  /** Abort any in-flight request when this screen unmounts. */
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  /** Catalog rules and schema are required before the form can render. */
  if (!validationRules || !schema) {
    return null;
  }

  /** Employment select options from catalog rules, with a blank placeholder first. */
  const employmentOptions = [
    { value: '', label: 'Select status' },
    ...(validationRules.personalInfo.employmentStatus.options ?? []).map((value) => ({
      value,
      label: getEmploymentStatusLabel(value),
    })),
  ];

  /** Helper copy derived from validation-rule minimums (with sensible defaults). */
  const ageMin = validationRules.personalInfo.age.min ?? 18;
  const ageMax = validationRules.personalInfo.age.max ?? 60;
  const ageHelper = `Enter an age between ${ageMin} and ${ageMax}.`;
  const statusHelper = 'Select the option that best matches your situation.';
  const durationMin = validationRules.personalInfo.employmentDuration.min ?? 3;
  const durationHelper = `Enter at least ${durationMin} months for your employment status.`;
  const incomeMin = validationRules.financialInfo.monthlyIncome.min ?? 5000;
  const incomeHelper = `Take-home (net) income. Enter at least ${formatMoney(incomeMin)}.`;
  const expensesHelper = 'Enter your typical monthly expenses in rand.';

  /** Show an error only after submit or when that field has been touched. */
  const showFieldError = (field: keyof BudgetFormValues): string | undefined => {
    if (!(isSubmitted || touchedFields[field])) {
      return undefined;
    }
    return errors[field]?.message;
  };

  /** Focus the first invalid field in FIELD_ORDER by matching element identifier. */
  const focusFirstInvalid = (fieldErrors: Partial<Record<keyof BudgetFormValues, unknown>>) => {
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!firstInvalid) {
      return;
    }
    document.getElementById(firstInvalid)?.focus();
  };

  /**
   * Valid submit path:
   * - Read journey/call to action mode from the store at submit time (avoids stale "View result").
   * - If loan context is missing, show an error and stop.
   * - If mode is "view", navigate to the result without re-calling APIs.
   * - Otherwise abort any prior request, optionally run credit check, then eligibility.
   * - Stale responses (generation mismatch) and aborts are ignored; only the
   *   latest generation clears the submitting flag in finally.
   */
  const onValidSubmit = async (values: BudgetFormParsedValues) => {
    const stateAtSubmit = store.getState();
    const journeyAtSubmit = stateAtSubmit.journey;
    const actionModeAtSubmit = selectDetailsPrimaryActionMode(stateAtSubmit);

    const hasLoanContextAtSubmit = [
      journeyAtSubmit.selectedProductId,
      journeyAtSubmit.selectedPurpose,
      journeyAtSubmit.loanAmount,
      journeyAtSubmit.loanTerm,
    ].every((value) => value !== null);

    if (!hasLoanContextAtSubmit) {
      setSubmitError('Return to your loan and complete your loan selection first.');
      return;
    }

    if (actionModeAtSubmit === 'view') {
      dispatch(setCurrentScreen('yourResult'));
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;

    try {
      let creditScore = selectEffectiveCreditScoreValue(stateAtSubmit);
      let creditCheckFailed = false;

      /** Optional simulated credit check when the user opted in. */
      if (journeyAtSubmit.creditCheckOptIn) {
        const checkResult = await runCreditCheck({
          signal: controller.signal,
          state: store.getState().journey.creditCheckState,
        });
        if (generation !== requestGenerationRef.current) {
          return;
        }
        if (!checkResult.ok) {
          /** Continue without a score; overall risk will be not fully assessed. */
          creditCheckFailed = true;
          creditScore = undefined;
          dispatch(setCreditCheckScore(null));
        } else {
          dispatch(setCreditCheckScore(checkResult.creditScore));
          creditScore = checkResult.creditScore;
        }
      }

      /** Eligibility uses latest loan draft plus parsed form values and optional score. */
      const latestJourney = store.getState().journey;
      const result = await checkEligibility(
        {
          personalInfo: {
            age: values.age,
            employmentStatus: values.employmentStatus,
            employmentDuration: values.employmentDuration,
          },
          financialInfo: {
            monthlyIncome: values.monthlyIncome,
            monthlyExpenses: values.monthlyExpenses,
            existingDebt: values.existingDebt,
            ...(creditScore === undefined ? {} : { creditScore }),
            ...(creditCheckFailed ? { creditCheckFailed: true } : {}),
          },
          loanDetails: {
            requestedAmount: latestJourney.loanAmount as number,
            loanTerm: latestJourney.loanTerm as number,
            loanPurpose: latestJourney.selectedPurpose as string,
          },
        },
        { signal: controller.signal },
      );

      if (generation !== requestGenerationRef.current) {
        return;
      }

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      /** Persist result + fingerprint inputs, then navigate to the result step. */
      const inputs: EligibilityInputs = {
        age: values.age,
        employmentStatus: values.employmentStatus,
        employmentDuration: values.employmentDuration,
        monthlyIncome: values.monthlyIncome,
        monthlyExpenses: values.monthlyExpenses,
        existingDebt: values.existingDebt,
        creditScore: creditScore ?? null,
        requestedAmount: latestJourney.loanAmount as number,
        loanTerm: latestJourney.loanTerm as number,
        loanPurpose: latestJourney.selectedPurpose as string,
        productId: latestJourney.selectedProductId as string,
      };
      dispatch(
        setEligibilityResult({
          result: result.data,
          inputs,
        }),
      );
      dispatch(setCurrentScreen('yourResult'));
    } catch (error) {
      /** Aborts and superseded generations are silent; other failures show a generic message. */
      if (isAbortError(error)) {
        return;
      }
      if (generation !== requestGenerationRef.current) {
        return;
      }
      setSubmitError('Unable to check eligibility. Please try again.');
    } finally {
      if (generation === requestGenerationRef.current) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  /** Invalid form → focus the first field with an error. */
  const onInvalidSubmit = (fieldErrors: Partial<Record<keyof BudgetFormValues, unknown>>) => {
    focusFirstInvalid(fieldErrors);
  };

  return (
    <JourneyLayout currentStepId="yourBudget" completedStepIds={['loanDetails']}>
      <div className={styles.page}>
        {/* Screen intro and required-field note */}
        <header className={styles.intro}>
          <h1 id="your-details-heading" className={styles.title}>
            Your details
          </h1>
          <p className={styles.description}>
            Tell us about your personal and financial situation so we can check eligibility.
          </p>
          <p className={styles.requiredNote}>
            Required fields are marked with an asterisk (<span aria-hidden="true">*</span>
            ).
          </p>
        </header>

        {/* Block form use when step-1 loan context is incomplete */}
        {!hasLoanContext ? (
          <div className={styles.missingLoan} role="alert">
            <p>Your loan selection is missing or incomplete.</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                dispatch(setCurrentScreen('loanDetails'));
              }}
            >
              Return to your loan
            </Button>
          </div>
        ) : null}

        <form
          className={styles.form}
          noValidate
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        >
          {/* Personal details: age, employment status, optional duration */}
          <FormSectionCard icon={User} title="Personal details">
            <div className={styles.fieldRow}>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <WholeNumberInput
                    id="age"
                    name={field.name}
                    label="Age"
                    required
                    placeholder="Enter age"
                    helperText={ageHelper}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={showFieldError('age')}
                  />
                )}
              />
              <Controller
                name="employmentStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    id="employmentStatus"
                    name={field.name}
                    label="Employment status"
                    required
                    options={employmentOptions}
                    helperText={statusHelper}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    errorText={showFieldError('employmentStatus')}
                  />
                )}
              />
            </div>
            {/* Duration only when the selected status requires it */}
            {showEmploymentDuration ? (
              <div className={styles.fieldHalf}>
                <Controller
                  name="employmentDuration"
                  control={control}
                  render={({ field }) => (
                    <WholeNumberInput
                      id="employmentDuration"
                      name={field.name}
                      label="Employment duration"
                      required
                      placeholder="Enter duration"
                      suffix="months"
                      helperText={durationHelper}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={showFieldError('employmentDuration')}
                    />
                  )}
                />
              </div>
            ) : null}
          </FormSectionCard>

          {/* Monthly finances: income, expenses, optional existing debt */}
          <FormSectionCard icon={Wallet} title="Monthly finances">
            <div className={styles.fieldRow}>
              <Controller
                name="monthlyIncome"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="monthlyIncome"
                    name={field.name}
                    label="Monthly take-home income"
                    required
                    placeholder="Enter take-home income"
                    helperText={incomeHelper}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={showFieldError('monthlyIncome')}
                  />
                )}
              />
              <Controller
                name="monthlyExpenses"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="monthlyExpenses"
                    name={field.name}
                    label="Monthly expenses"
                    required
                    placeholder="Enter expenses"
                    helperText={expensesHelper}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={showFieldError('monthlyExpenses')}
                  />
                )}
              />
            </div>
            <Controller
              name="existingDebt"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  id="existingDebt"
                  name={field.name}
                  label="Existing monthly debt repayments"
                  placeholder="Enter monthly repayments"
                  helperText="Optional. Enter monthly debt repayments in rand, or leave blank."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={showFieldError('existingDebt')}
                />
              )}
            />
          </FormSectionCard>

          {/* Optional demo credit check: opt-in clears stored score; scenarios disabled when off */}
          <div className={styles.consent}>
            <Checkbox
              label="I consent to a credit bureau check"
              checked={journey.creditCheckOptIn}
              helperText="You can continue without a credit check."
              onChange={(event) => {
                setSubmitError(null);
                dispatch(setCreditCheckOptIn(event.target.checked));
                if (event.target.checked) {
                  dispatch(setCreditCheckScore(null));
                }
              }}
            />
            <SegmentedRadio
              name="creditCheckState"
              aria-label="Simulated credit check scenario"
              value={journey.creditCheckState}
              options={CREDIT_CHECK_SCENARIO_OPTIONS}
              disabled={!journey.creditCheckOptIn}
              helperText="Demo scenarios only. No real credit check is performed."
              onChange={(next) => {
                setSubmitError(null);
                dispatch(setCreditCheckState(next));
              }}
            />
          </div>

          {/* Submit / eligibility endpoint error */}
          {submitError ? <ErrorText id="eligibility-submit-error">{submitError}</ErrorText> : null}

          {/* Back + primary call to action: Check eligibility, or View result when a current result exists */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => {
                dispatch(setCurrentScreen('loanDetails'));
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !hasLoanContext}
              aria-busy={isSubmitting || undefined}
            >
              {isSubmitting ? (
                'Checking eligibility…'
              ) : detailsActionMode === 'view' ? (
                'View result'
              ) : (
                <>
                  Check eligibility
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
          {/* Screen-reader live region while the eligibility request is in flight */}
          {isSubmitting ? (
            <p className={styles.srOnly} role="status" aria-live="polite">
              Checking eligibility…
            </p>
          ) : null}
        </form>
      </div>
    </JourneyLayout>
  );
};

export default YourDetailsScreen;
