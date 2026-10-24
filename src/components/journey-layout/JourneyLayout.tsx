import type { ReactNode } from 'react';

import { AppHeader } from '../app-header';
import { ProgressStepper, type ProgressStep } from '../progress-stepper';
import { JOURNEY_SCREENS, setCurrentScreen, useAppDispatch, type JourneyScreen } from '../../store';
import styles from './JourneyLayout.module.scss';

/** Step identifiers must stay aligned with `JOURNEY_SCREENS` in the journey slice. */
export const JOURNEY_STEPS: readonly ProgressStep[] = [
  { id: 'loanDetails', label: 'Your loan' },
  { id: 'yourBudget', label: 'Your details', compactLabel: 'Details' },
  { id: 'yourResult', label: 'Eligibility' },
] as const;

/** Properties for the shared journey chrome around a screen. */
export type JourneyLayoutProps = {
  readonly currentStepId: string;
  readonly completedStepIds?: readonly string[];
  readonly children: ReactNode;
};

/** Narrows a step identifier to a known journey screen before dispatching. */
const isJourneyScreen = (value: string): value is JourneyScreen =>
  (JOURNEY_SCREENS as readonly string[]).includes(value);

/**
 * Journey chrome: skip link, header, progress stepper, and main content slot.
 */
export const JourneyLayout = ({
  currentStepId,
  completedStepIds,
  children,
}: JourneyLayoutProps) => {
  const dispatch = useAppDispatch();

  /** Navigate to a completed step when the stepper is clicked. */
  const handleStepClick = (stepId: string) => {
    if (isJourneyScreen(stepId)) {
      dispatch(setCurrentScreen(stepId));
    }
  };

  return (
    <div className={styles.shell}>
      {/* Skip link for keyboard users */}
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      {/* Progress stepper */}
      <div className={styles.stepperWrap}>
        <ProgressStepper
          steps={JOURNEY_STEPS}
          currentStepId={currentStepId}
          completedStepIds={completedStepIds}
          onStepClick={handleStepClick}
        />
      </div>
      {/* Active journey screen */}
      <main id="main-content" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default JourneyLayout;
