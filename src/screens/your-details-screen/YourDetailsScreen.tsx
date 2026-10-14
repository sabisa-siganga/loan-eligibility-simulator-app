import { JourneyLayout } from '../../components/journey-layout';
import { Button } from '../../components/ui';
import { setCurrentScreen, useAppDispatch } from '../../store';
import styles from './YourDetailsScreen.module.scss';

export const YourDetailsScreen = () => {
  const dispatch = useAppDispatch();

  return (
    <JourneyLayout currentStepId="yourBudget" completedStepIds={['loanDetails']}>
      <section className={styles.panel} aria-labelledby="your-details-heading">
        <h1 id="your-details-heading" className={styles.title}>
          Your details
        </h1>
        <p className={styles.description}>
          Personal and financial details will be collected here in a later step. Your loan
          selections are saved — go back to review or change them.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            dispatch(setCurrentScreen('loanDetails'));
          }}
        >
          Back to your loan
        </Button>
      </section>
    </JourneyLayout>
  );
};

export default YourDetailsScreen;
