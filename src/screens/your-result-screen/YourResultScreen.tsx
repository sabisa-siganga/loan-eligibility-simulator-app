import { JourneyLayout } from '../../components/journey-layout';
import { Button } from '../../components/ui';
import { selectJourney, setCurrentScreen, useAppDispatch, useAppSelector } from '../../store';
import styles from './YourResultScreen.module.scss';

export const YourResultScreen = () => {
  const dispatch = useAppDispatch();
  const journey = useAppSelector(selectJourney);
  const result = journey.eligibilityResult;

  return (
    <JourneyLayout
      currentStepId="yourResult"
      completedStepIds={['loanDetails', 'yourBudget']}
    >
      <section className={styles.panel} aria-labelledby="your-result-heading">
        <h1 id="your-result-heading" className={styles.title}>
          Eligibility
        </h1>
        {result ? (
          <>
            <p className={styles.description}>
              {result.eligibilityResult.isEligible
                ? 'Your details meet the eligibility rules for this estimate.'
                : 'Based on the details provided, you are not eligible for this estimate.'}
            </p>
            <p className={styles.reason}>{result.eligibilityResult.decisionReason}</p>
          </>
        ) : (
          <p className={styles.description}>
            No eligibility result is available yet. Return to your details to check eligibility.
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            dispatch(setCurrentScreen('yourBudget'));
          }}
        >
          Back
        </Button>
      </section>
    </JourneyLayout>
  );
};

export default YourResultScreen;
