import type { ReactNode } from 'react';

import { AppHeader } from '../app-header';
import { ProgressStepper, type ProgressStep } from '../progress-stepper';
import { JOURNEY_SCREENS, setCurrentScreen, useAppDispatch, type JourneyScreen } from '../../store';
import styles from './JourneyLayout.module.scss';

/** Step ids must stay aligned with `JOURNEY_SCREENS` in the journey slice. */
export const JOURNEY_STEPS: readonly ProgressStep[] = [
  { id: 'loanDetails', label: 'Your loan' },
  { id: 'yourBudget', label: 'Your details', compactLabel: 'Details' },
  { id: 'yourResult', label: 'Eligibility' },
] as const;

export type JourneyLayoutProps = {
  readonly currentStepId: string;
  readonly completedStepIds?: readonly string[];
  readonly children: ReactNode;
};

const isJourneyScreen = (value: string): value is JourneyScreen =>
  (JOURNEY_SCREENS as readonly string[]).includes(value);

export const JourneyLayout = ({
  currentStepId,
  completedStepIds,
  children,
}: JourneyLayoutProps) => {
  const dispatch = useAppDispatch();

  const handleStepClick = (stepId: string) => {
    if (isJourneyScreen(stepId)) {
      dispatch(setCurrentScreen(stepId));
    }
  };

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <div className={styles.stepperWrap}>
        <ProgressStepper
          steps={JOURNEY_STEPS}
          currentStepId={currentStepId}
          completedStepIds={completedStepIds}
          onStepClick={handleStepClick}
        />
      </div>
      <main id="main-content" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default JourneyLayout;
