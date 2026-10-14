import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, User, Wallet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { FormSectionCard } from '../../components/form-section-card';
import { JourneyLayout } from '../../components/journey-layout';
import { MoneyInput } from '../../components/money-input';
import { WholeNumberInput } from '../../components/whole-number-input';
import { Button, Checkbox, ErrorText, Select } from '../../components/ui';
import { runCreditCheck } from '../../services/creditCheck';
import { checkEligibility } from '../../services/eligibility';
import {
  selectDetailsPrimaryActionMode,
  selectEffectiveCreditScoreValue,
  selectJourney,
  setCreditCheckOptIn,
  setCreditCheckScore,
  setCurrentScreen,
  setEligibilityResult,
  setFinancialDetails,
  setPersonalDetails,
  useAppDispatch,
  useAppSelector,
  type EligibilityInputs,
} from '../../store';
import {
  buildBudgetSchema,
  type BudgetFormParsedValues,
  type BudgetFormValues,
} from '../../utils/buildFormSchemas';
import { getEmploymentStatusLabel } from '../../utils/employmentStatusLabels';
import styles from './YourDetailsScreen.module.scss';

const draftNumberToText = (value: number | null): string => (value === null ? '' : String(value));

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

export const YourDetailsScreen = () => {
  const dispatch = useAppDispatch();
  const journey = useAppSelector(selectJourney);
  const validationRules = useAppSelector((state) => state.catalog.validationRules);
  const detailsActionMode = useAppSelector(selectDetailsPrimaryActionMode);
  const effectiveCreditScore = useAppSelector(selectEffectiveCreditScoreValue);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestGenerationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const hasLoanContext =
    journey.selectedProductId !== null &&
    journey.selectedPurpose !== null &&
    journey.loanAmount !== null &&
    journey.loanTerm !== null;

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
    setFocus,
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

  useEffect(() => {
    const nextPersonal = {
      age: textToDraftNumber(watchedValues.age),
      employmentStatus:
        watchedValues.employmentStatus.trim() === '' ? null : watchedValues.employmentStatus,
      employmentDuration: textToDraftNumber(watchedValues.employmentDuration),
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

  const durationMin = validationRules.personalInfo.employmentDuration.min ?? 3;
  const durationHelper = `Enter at least ${durationMin} months for your employment status.`;

  const showFieldError = (field: keyof BudgetFormValues): string | undefined => {
    if (!(isSubmitted || touchedFields[field])) {
      return undefined;
    }
    return errors[field]?.message;
  };

  const focusFirstInvalid = (fieldErrors: Partial<Record<keyof BudgetFormValues, unknown>>) => {
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid) {
      setFocus(firstInvalid);
    }
  };

  const buildEligibilityInputs = (values: BudgetFormParsedValues): EligibilityInputs => ({
    age: values.age,
    employmentStatus: values.employmentStatus,
    employmentDuration: values.employmentDuration,
    monthlyIncome: values.monthlyIncome,
    monthlyExpenses: values.monthlyExpenses,
    existingDebt: values.existingDebt,
    creditScore: effectiveCreditScore ?? null,
    requestedAmount: journey.loanAmount as number,
    loanTerm: journey.loanTerm as number,
    loanPurpose: journey.selectedPurpose as string,
    productId: journey.selectedProductId as string,
  });

  const onValidSubmit = async (values: BudgetFormParsedValues) => {
    if (!hasLoanContext) {
      setSubmitError('Return to your loan and complete your loan selection first.');
      return;
    }

    if (detailsActionMode === 'view') {
      dispatch(setCurrentScreen('yourResult'));
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;

    try {
      let creditScore = effectiveCreditScore;

      if (journey.creditCheckOptIn) {
        const checkResult = await runCreditCheck({ signal: controller.signal });
        if (generation !== requestGenerationRef.current) {
          return;
        }
        if (!checkResult.ok) {
          setSubmitError(checkResult.message);
          setIsSubmitting(false);
          return;
        }
        dispatch(setCreditCheckScore(checkResult.creditScore));
        creditScore = checkResult.creditScore;
      }

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
            requestedAmount: journey.loanAmount as number,
            loanTerm: journey.loanTerm as number,
            loanPurpose: journey.selectedPurpose as string,
          },
        },
        { signal: controller.signal },
      );

      if (generation !== requestGenerationRef.current) {
        return;
      }

      if (!result.ok) {
        setSubmitError(result.message);
        setIsSubmitting(false);
        return;
      }

      const inputs = buildEligibilityInputs(values);
      dispatch(
        setEligibilityResult({
          result: result.data,
          inputs: {
            ...inputs,
            creditScore: creditScore ?? null,
          },
        }),
      );
      dispatch(setCurrentScreen('yourResult'));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (generation !== requestGenerationRef.current) {
        return;
      }
      setSubmitError('Unable to check eligibility. Please try again.');
    } finally {
      if (generation === requestGenerationRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const onInvalidSubmit = () => {
    focusFirstInvalid(errors);
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
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    errorText={showFieldError('employmentStatus')}
                  />
                )}
              />
            </div>
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
          </FormSectionCard>

          <FormSectionCard
            icon={Wallet}
            title="Monthly finances"
            footer={
              <p className={styles.requiredNote}>
                <span aria-hidden="true">*</span> Required fields
              </p>
            }
          >
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
                  label="Existing debt"
                  required
                  placeholder="Enter debt"
                  helperText="Enter your monthly financial details in rand."
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
