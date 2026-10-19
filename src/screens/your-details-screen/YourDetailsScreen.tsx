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

const draftNumberToText = (value: number | null): string => (value === null ? '' : String(value));

const CREDIT_CHECK_SCENARIO_OPTIONS: ReadonlyArray<{
  value: CreditCheckState;
  label: string;
}> = [
  { value: 'bad', label: 'Poor credit' },
  { value: 'good', label: 'Good credit' },
  { value: 'over_limit', label: 'Over limit' },
];

const textToDraftNumber = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
 * snapshots so concurrent credit-scenario changes cannot race the CTA mode.
 */
export const YourDetailsScreen = () => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const journey = useAppSelector(selectJourney);
  const validationRules = useAppSelector((state) => state.catalog.validationRules);
  const detailsActionMode = useAppSelector(selectDetailsPrimaryActionMode);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Generation + AbortController discard stale responses when the user re-submits.
  const requestGenerationRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasFocusedFirstFieldRef = useRef(false);

  useEffect(() => {
    if (hasFocusedFirstFieldRef.current) {
      return;
    }
    hasFocusedFirstFieldRef.current = true;
    // Land on the first interactive control so titles stay out of the tab/focus path.
    document.getElementById('age')?.focus();
  }, []);

  const hasLoanContext = [
    journey.selectedProductId,
    journey.selectedPurpose,
    journey.loanAmount,
    journey.loanTerm,
  ].every((value) => value !== null);

  const schema = useMemo(
    () => (validationRules ? buildBudgetSchema({ rules: validationRules }) : null),
    [validationRules],
  );

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

  // Hide duration for unemployed/retired and clear leftover values so they
  // cannot fail validation or persist into the eligibility fingerprint.
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

  // Mirror form → Redux draft (same persistence pattern as the loan step).
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

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  if (!validationRules || !schema) {
    return null;
  }

  const employmentOptions = [
    { value: '', label: 'Select status' },
    ...(validationRules.personalInfo.employmentStatus.options ?? []).map((value) => ({
      value,
      label: getEmploymentStatusLabel(value),
    })),
  ];

  const ageMin = validationRules.personalInfo.age.min ?? 18;
  const ageMax = validationRules.personalInfo.age.max ?? 60;
  const ageHelper = `Enter an age between ${ageMin} and ${ageMax}.`;
  const statusHelper = 'Select the option that best matches your situation.';
  const durationMin = validationRules.personalInfo.employmentDuration.min ?? 3;
  const durationHelper = `Enter at least ${durationMin} months for your employment status.`;
  const incomeMin = validationRules.financialInfo.monthlyIncome.min ?? 5000;
  const incomeHelper = `Enter at least ${formatMoney(incomeMin)}.`;
  const expensesHelper = 'Enter your typical monthly expenses in rand.';

  const showFieldError = (field: keyof BudgetFormValues): string | undefined => {
    if (!(isSubmitted || touchedFields[field])) {
      return undefined;
    }
    return errors[field]?.message;
  };

  const focusFirstInvalid = (fieldErrors: Partial<Record<keyof BudgetFormValues, unknown>>) => {
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!firstInvalid) {
      return;
    }
    document.getElementById(firstInvalid)?.focus();
  };

  const onValidSubmit = async (values: BudgetFormParsedValues) => {
    // Read journey at submit time so a credit-check change cannot leave a stale
    // "View result" shortcut navigating to a cleared result.
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

      if (journeyAtSubmit.creditCheckOptIn) {
        const checkResult = await runCreditCheck({
          signal: controller.signal,
          state: store.getState().journey.creditCheckState,
        });
        if (generation !== requestGenerationRef.current) {
          return;
        }
        if (!checkResult.ok) {
          setSubmitError(checkResult.message);
          return;
        }
        dispatch(setCreditCheckScore(checkResult.creditScore));
        creditScore = checkResult.creditScore;
      }

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

  const onInvalidSubmit = (fieldErrors: Partial<Record<keyof BudgetFormValues, unknown>>) => {
    focusFirstInvalid(fieldErrors);
  };

  return (
    <JourneyLayout currentStepId="yourBudget" completedStepIds={['loanDetails']}>
      <div className={styles.page}>
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

          <FormSectionCard icon={Wallet} title="Monthly finances">
            <div className={styles.fieldRow}>
              <Controller
                name="monthlyIncome"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="monthlyIncome"
                    name={field.name}
                    label="Monthly income"
                    required
                    placeholder="Enter income"
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

          {submitError ? <ErrorText id="eligibility-submit-error">{submitError}</ErrorText> : null}

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
