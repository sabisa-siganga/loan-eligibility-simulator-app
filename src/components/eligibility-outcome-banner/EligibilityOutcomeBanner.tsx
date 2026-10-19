import { CircleCheck, CircleX, Info } from 'lucide-react';

import styles from './EligibilityOutcomeBanner.module.scss';

export type EligibilityOutcomeBannerTone = 'success' | 'neutral' | 'unsuccessful';

export type EligibilityOutcomeKind = 'eligibility' | 'assessment_error';

export type EligibilityOutcomeBannerProps = {
  readonly isEligible: boolean;
  readonly decisionReason: string;
  /**
   * Visual tone. When omitted, derived from isEligible only (success/unsuccessful).
   * Prefer passing explicitly from the result screen for risk-aware eligible banners.
   */
  readonly tone?: EligibilityOutcomeBannerTone;
  /** Assessment errors use a distinct heading (not an eligibility decline). */
  readonly outcomeKind?: EligibilityOutcomeKind;
};

const resolveTone = (
  isEligible: boolean,
  tone: EligibilityOutcomeBannerTone | undefined,
): EligibilityOutcomeBannerTone => {
  if (tone !== undefined) {
    return tone;
  }
  return isEligible ? 'success' : 'unsuccessful';
};

const resolveHeading = (
  outcomeKind: EligibilityOutcomeKind,
  isEligible: boolean,
): string => {
  if (outcomeKind === 'assessment_error') {
    return 'We could not complete your assessment';
  }
  return isEligible
    ? 'You meet the initial eligibility criteria'
    : 'You do not meet the eligibility criteria';
};

export const EligibilityOutcomeBanner = ({
  isEligible,
  decisionReason,
  tone: toneProp,
  outcomeKind = 'eligibility',
}: EligibilityOutcomeBannerProps) => {
  const tone = resolveTone(isEligible, toneProp);
  const Icon = tone === 'unsuccessful' ? CircleX : tone === 'neutral' ? Info : CircleCheck;

  const sectionClassName =
    tone === 'success'
      ? styles.success
      : tone === 'neutral'
        ? styles.neutral
        : styles.unsuccessful;
  const iconClassName =
    tone === 'success'
      ? styles.iconSuccess
      : tone === 'neutral'
        ? styles.iconNeutral
        : styles.iconUnsuccessful;
  const dividerClassName =
    tone === 'success'
      ? styles.dividerSuccess
      : tone === 'neutral'
        ? styles.dividerNeutral
        : styles.dividerUnsuccessful;
  const headingClassName =
    tone === 'success'
      ? styles.headingSuccess
      : tone === 'neutral'
        ? styles.headingNeutral
        : styles.headingUnsuccessful;

  return (
    <section
      className={sectionClassName}
      aria-labelledby="eligibility-outcome-heading"
    >
      <Icon className={iconClassName} size={40} strokeWidth={2.25} aria-hidden="true" />
      <span className={dividerClassName} aria-hidden="true" />
      <div className={styles.copy}>
        <h2 id="eligibility-outcome-heading" className={`${styles.heading} ${headingClassName}`}>
          {resolveHeading(outcomeKind, isEligible)}
        </h2>
        <p className={styles.reason}>{decisionReason}</p>
      </div>
    </section>
  );
};

export default EligibilityOutcomeBanner;
