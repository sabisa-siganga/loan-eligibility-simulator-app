import { useEffect, useRef } from 'react';

import { AffordabilityGlancePanel } from '../../components/affordability-glance-panel';
import { EligibilityOutcomeBanner } from '../../components/eligibility-outcome-banner';
import { InfoNotice } from '../../components/info-notice';
import { JourneyLayout } from '../../components/journey-layout';
import { RecommendedLoanPanel } from '../../components/recommended-loan-panel';
import { ResultUnavailable } from '../../components/result-unavailable';
import { Button } from '../../components/ui';
import {
  resetJourney,
  selectEligibilityMatchesCurrentInputs,
  selectJourney,
  selectProducts,
  setCurrentScreen,
  useAppDispatch,
  useAppSelector,
} from '../../store';
import { getPurposeLabel } from '../../utils/purposeLabels';
import styles from './YourResultScreen.module.scss';

/** Declined offers zero out recommendation fields — treat those as "no offer". */
const hasUsableRecommendation = (isEligible: boolean, amount: number): boolean => {
  if (!isEligible && amount === 0) {
    return false;
  }
  return Number.isFinite(amount);
};

/**
 * Step 3: show eligibility only when the stored result still matches the live
 * draft fingerprint; otherwise prompt to re-check (outdated) or return (none).
 */
export const YourResultScreen = () => {
  const dispatch = useAppDispatch();
  const journey = useAppSelector(selectJourney);
  const products = useAppSelector(selectProducts);
  const isCurrentResult = useAppSelector(selectEligibilityMatchesCurrentInputs);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasFocusedTitleRef = useRef(false);

  useEffect(() => {
    if (hasFocusedTitleRef.current) {
      return;
    }
    hasFocusedTitleRef.current = true;
    titleRef.current?.focus();
  }, []);

  const goToDetails = () => {
    dispatch(setCurrentScreen('yourBudget'));
  };

  const startAgain = () => {
    dispatch(resetJourney());
  };

  const hasStoredResult = journey.eligibilityResult !== null && journey.eligibilityInputs !== null;
  // Prefer "outdated" over "none" when a previous result exists but inputs moved.
  const unavailableKind = hasStoredResult && !isCurrentResult ? 'outdated' : 'none';
  const showResult = hasStoredResult && isCurrentResult;

  const result = showResult ? journey.eligibilityResult : null;
  const inputs = showResult ? journey.eligibilityInputs : null;

  return (
    <JourneyLayout currentStepId="yourResult" completedStepIds={['loanDetails', 'yourBudget']}>
      <div className={styles.page}>
        <header className={styles.intro}>
          <h1 ref={titleRef} className={styles.title} tabIndex={-1}>
            Your eligibility result
          </h1>
          <p className={styles.description}>Review your outcome and recommended loan.</p>
        </header>

        {result && inputs ? (
          <>
            <EligibilityOutcomeBanner
              isEligible={result.eligibilityResult.isEligible}
              decisionReason={result.eligibilityResult.decisionReason}
            />

            <div className={styles.resultsCard}>
              <RecommendedLoanPanel
                className={styles.recommendedColumn}
                isEligible={result.eligibilityResult.isEligible}
                productLabel={
                  products.find((item) => item.id === inputs.productId)?.name ?? 'Not available'
                }
                purposeLabel={getPurposeLabel(inputs.loanPurpose)}
                requestedAmount={inputs.requestedAmount}
                loanTermMonths={inputs.loanTerm}
                offer={
                  hasUsableRecommendation(
                    result.eligibilityResult.isEligible,
                    result.recommendedLoan.recommendedAmount,
                  )
                    ? result.recommendedLoan
                    : null
                }
              />
              <AffordabilityGlancePanel
                className={styles.affordabilityColumn}
                monthlyIncome={inputs.monthlyIncome}
                monthlyExpenses={inputs.monthlyExpenses}
                existingDebt={inputs.existingDebt}
                newRepayment={
                  hasUsableRecommendation(
                    result.eligibilityResult.isEligible,
                    result.recommendedLoan.monthlyPayment,
                  )
                    ? result.recommendedLoan.monthlyPayment
                    : null
                }
                disposableIncome={result.affordabilityAnalysis.disposableIncome}
                debtToIncomeRatio={result.affordabilityAnalysis.debtToIncomeRatio}
                loanToIncomeRatio={result.affordabilityAnalysis.loanToIncomeRatio}
                affordabilityScore={result.affordabilityAnalysis.affordabilityScore}
                approvalLikelihood={result.eligibilityResult.approvalLikelihood}
                riskCategory={result.eligibilityResult.riskCategory}
              />
            </div>

            <InfoNotice>
              Eligibility is an estimate. Final approval is subject to verification.
            </InfoNotice>
          </>
        ) : (
          <ResultUnavailable kind={unavailableKind} onReturn={goToDetails} />
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            className={styles.backButton}
            onClick={goToDetails}
          >
            Back
          </Button>
          <Button type="button" variant="primary" onClick={startAgain}>
            Start again
          </Button>
        </div>
      </div>
    </JourneyLayout>
  );
};

export default YourResultScreen;
