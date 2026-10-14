import styles from './ProgressStepper.module.scss';

export type ProgressStep = {
  readonly id: string;
  readonly label: string;
};

export type ProgressStepperProps = {
  readonly steps: readonly ProgressStep[];
  readonly currentStepId: string;
  readonly completedStepIds?: readonly string[];
};

export const ProgressStepper = ({
  steps,
  currentStepId,
  completedStepIds = [],
}: ProgressStepperProps) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <nav className={styles.nav} aria-label="Application progress">
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id) && !isCurrent;
          const isUpcoming = index > currentIndex && !isCompleted;
          const statusClass = isCurrent
            ? styles.current
            : isCompleted
              ? styles.completed
              : styles.upcoming;

          return (
            <li key={step.id} className={[styles.item, statusClass].join(' ')}>
              {index > 0 ? <span className={styles.connector} aria-hidden="true" /> : null}
              <span className={styles.marker} aria-hidden="true">
                {isCompleted ? '✓' : index + 1}
              </span>
              <span className={styles.label}>
                {isCurrent ? <span className="visually-hidden">Current step: </span> : null}
                {isUpcoming ? <span className="visually-hidden">Upcoming step: </span> : null}
                {isCompleted ? <span className="visually-hidden">Completed step: </span> : null}
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressStepper;
