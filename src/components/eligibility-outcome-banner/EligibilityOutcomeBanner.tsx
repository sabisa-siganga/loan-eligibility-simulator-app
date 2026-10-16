import { CircleCheck, CircleX } from 'lucide-react';

import styles from './EligibilityOutcomeBanner.module.scss';

export type EligibilityOutcomeBannerProps = {
  readonly isEligible: boolean;
  readonly decisionReason: string;
};

export const EligibilityOutcomeBanner = ({
  isEligible,
  decisionReason,
}: EligibilityOutcomeBannerProps) => {
  const Icon = isEligible ? CircleCheck : CircleX;

  return (
    <section
      className={isEligible ? styles.success : styles.unsuccessful}
      aria-labelledby="eligibility-outcome-heading"
    >
      <Icon
        className={isEligible ? styles.iconSuccess : styles.iconUnsuccessful}
        size={40}
        strokeWidth={2.25}
        aria-hidden="true"
      />
      <span
        className={isEligible ? styles.dividerSuccess : styles.dividerUnsuccessful}
        aria-hidden="true"
      />
      <div className={styles.copy}>
        <h2 id="eligibility-outcome-heading" className={styles.heading}>
          {isEligible
            ? 'You meet the eligibility criteria'
            : 'You do not meet the eligibility criteria'}
        </h2>
        <p className={styles.reason}>{decisionReason}</p>
      </div>
    </section>
  );
};

export default EligibilityOutcomeBanner;
