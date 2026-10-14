import type { ReactNode } from 'react';

import { AppHeader } from '../app-header';
import { ProgressStepper, type ProgressStep } from '../progress-stepper';
import styles from './JourneyLayout.module.scss';

export const JOURNEY_STEPS: readonly ProgressStep[] = [
  { id: 'loanDetails', label: 'Your loan' },
  { id: 'yourBudget', label: 'Your details' },
  { id: 'yourResult', label: 'Eligibility' },
] as const;

export type JourneyLayoutProps = {
  readonly currentStepId: string;
  readonly completedStepIds?: readonly string[];
  readonly children: ReactNode;
};

export const JourneyLayout = ({
  currentStepId,
  completedStepIds,
  children,
}: JourneyLayoutProps) => (
  <div className={styles.shell}>
    <AppHeader />
    <div className={styles.stepperWrap}>
      <ProgressStepper
        steps={JOURNEY_STEPS}
        currentStepId={currentStepId}
        completedStepIds={completedStepIds}
      />
    </div>
    <main className={styles.main}>{children}</main>
  </div>
);

export default JourneyLayout;
