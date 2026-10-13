import { resetJourney, selectCurrentScreen, useAppDispatch, useAppSelector } from '../../store';
import { Button } from '../ui';
import styles from './AppShell.module.scss';

const SCREEN_LABELS = {
  loanDetails: 'Loan details',
  yourBudget: 'Your budget',
  yourResult: 'Your result',
} as const;

export const AppShell = () => {
  const dispatch = useAppDispatch();
  const currentScreen = useAppSelector(selectCurrentScreen);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.brand}>Loan Eligibility Simulator</p>
      </header>
      <main className={styles.main}>
        <section className={styles.panel} aria-labelledby="app-shell-heading">
          <h1 id="app-shell-heading" className={styles.title}>
            Loan Eligibility Simulator
          </h1>
          <p className={styles.subtitle}>
            Project foundation is ready. Loan screens will be added in a later task.
          </p>
          <p className={styles.screenLabel} data-testid="current-screen">
            Current screen: {SCREEN_LABELS[currentScreen]}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              dispatch(resetJourney());
            }}
          >
            Start again
          </Button>
        </section>
      </main>
    </div>
  );
};
