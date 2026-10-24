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

/** True when monthlyPayment is a finite number safe to show as a repayment. */
const hasUsableRepayment = (monthlyPayment: number): boolean => Number.isFinite(monthlyPayment);

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
  /** Ensures the page title receives focus only once on mount. */
  const hasFocusedTitleRef = useRef(false);

  /** Move keyboard focus to the screen title once on first mount. */
  useEffect(() => {
    if (hasFocusedTitleRef.current) {
      return;
    }
    hasFocusedTitleRef.current = true;
    titleRef.current?.focus();
  }, []);

  /** Navigate back to the details/budget step. */
  const goToDetails = () => {
    dispatch(setCurrentScreen('yourBudget'));
  };

  /** Clear the journey and return the user to the start of the flow. */
  const startAgain = () => {
    dispatch(resetJourney());
  };

  const hasStoredResult = journey.eligibilityResult !== null && journey.eligibilityInputs !== null;
  /** Prefer "outdated" over "none" when a previous result exists but inputs moved. */
  const unavailableKind = hasStoredResult && !isCurrentResult ? 'outdated' : 'none';
  const showResult = hasStoredResult && isCurrentResult;

  const result = showResult ? journey.eligibilityResult : null;
  const inputs = showResult ? journey.eligibilityInputs : null;

  /** Invalid credit response is treated as an assessment error, not a normal decision. */
  const isAssessmentError =
    result?.eligibilityResult.riskAssessmentStatus === 'invalid_credit_response';

  /**
   * Banner tone from eligibility + affordability:
   * unsuccessful for missing result, invalid credit, or ineligible;
   * success only for eligible + low risk + good affordability; else neutral.
   */
  const resolveBannerTone = (): 'success' | 'neutral' | 'unsuccessful' => {
    if (!result) {
      return 'unsuccessful';
    }
    const { isEligible, riskCategory, riskAssessmentStatus } = result.eligibilityResult;
    const affordabilityScore = result.affordabilityAnalysis.affordabilityScore;

    if (riskAssessmentStatus === 'invalid_credit_response') {
      return 'unsuccessful';
    }
    if (!isEligible) {
      return 'unsuccessful';
    }
    if (riskCategory === 'low' && affordabilityScore === 'good') {
      return 'success';
    }
    return 'neutral';
  };

  return (
    <JourneyLayout currentStepId="yourResult" completedStepIds={['loanDetails', 'yourBudget']}>
      <div className={styles.page}>
        {/* Screen intro */}
        <header className={styles.intro}>
          <h1 ref={titleRef} className={styles.title} tabIndex={-1}>
            Your eligibility result
          </h1>
          <p className={styles.description}>Review your outcome and recommended loan.</p>
        </header>

        {/* Current matching result, or unavailable (none / outdated) */}
        {result && inputs ? (
          <>
            <EligibilityOutcomeBanner
              isEligible={result.eligibilityResult.isEligible}
              decisionReason={result.eligibilityResult.decisionReason}
              tone={resolveBannerTone()}
              outcomeKind={isAssessmentError ? 'assessment_error' : 'eligibility'}
            />

            {/* Loan + affordability panels hidden when credit assessment failed */}
            {!isAssessmentError ? (
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
                  loanFigures={
                    hasUsableRepayment(result.recommendedLoan.monthlyPayment)
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
                    hasUsableRepayment(result.recommendedLoan.monthlyPayment)
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
            ) : null}

            <InfoNotice>
              Eligibility is an estimate. Final approval is subject to verification.
            </InfoNotice>
          </>
        ) : (
          <ResultUnavailable kind={unavailableKind} onReturn={goToDetails} />
        )}

        {/* Always available: back to details, or reset the whole journey */}
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
