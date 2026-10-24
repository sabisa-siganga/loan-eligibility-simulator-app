import styles from './ProgressStepper.module.scss';

/** One step in the journey progress nav. */
export type ProgressStep = {
  readonly id: string;
  readonly label: string;
  /** Shorter label shown on narrow viewports when set. */
  readonly compactLabel?: string;
};

/** Properties for the horizontal journey progress stepper. */
export type ProgressStepperProps = {
  readonly steps: readonly ProgressStep[];
  readonly currentStepId: string;
  readonly completedStepIds?: readonly string[];
  readonly onStepClick?: (stepId: string) => void;
};

/**
 * Accessible progress nav: current, completed (optionally clickable), and upcoming steps.
 */
export const ProgressStepper = ({
  steps,
  currentStepId,
  completedStepIds = [],
  onStepClick,
}: ProgressStepperProps) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <nav className={styles.nav} aria-label="Application progress">
      <ol className={styles.list}>
        {steps.map((step, index) => {
          /** Per-step status and whether completed steps can be reopened. */
          const isCurrent = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id) && !isCurrent;
          const isUpcoming = index > currentIndex && !isCompleted;
          const isClickable = isCompleted && onStepClick !== undefined;
          const statusClass = isCurrent
            ? styles.current
            : isCompleted
              ? styles.completed
              : styles.upcoming;

          const marker = (
            <span className={styles.marker} aria-hidden="true">
              {isCompleted ? '✓' : index + 1}
            </span>
          );

          const label = (
            <span className={styles.label}>
              {isCurrent ? <span className="visually-hidden">Current step: </span> : null}
              {isUpcoming ? <span className="visually-hidden">Upcoming step: </span> : null}
              {isCompleted ? <span className="visually-hidden">Completed step: </span> : null}
              <span className={styles.labelFull}>{step.label}</span>
              {step.compactLabel !== undefined ? (
                <span className={styles.labelCompact} aria-hidden="true">
                  {step.compactLabel}
                </span>
              ) : null}
            </span>
          );

          return (
            <li
              key={step.id}
              className={[styles.item, statusClass].join(' ')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connector line before every step after the first */}
              {index > 0 ? <span className={styles.connector} aria-hidden="true" /> : null}
              {/* Completed steps are buttons; others are static */}
              {isClickable ? (
                <button
                  type="button"
                  className={styles.stepButton}
                  onClick={() => {
                    onStepClick(step.id);
                  }}
                >
                  <span className={styles.step}>
                    {marker}
                    {label}
                  </span>
                </button>
              ) : (
                <span className={styles.step}>
                  {marker}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressStepper;
