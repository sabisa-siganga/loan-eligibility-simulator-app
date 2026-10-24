import { Clock, FileQuestion } from 'lucide-react';

import { Button } from '../ui';
import styles from './ResultUnavailable.module.scss';

/** Why the result screen cannot show an eligibility outcome. */
export type ResultUnavailableKind = 'none' | 'outdated';

/** Properties for the empty / outdated result state. */
export type ResultUnavailableProps = {
  readonly kind: ResultUnavailableKind;
  readonly onReturn: () => void;
};

/** Copy and icon for each unavailable-result kind. */
const content: Record<
  ResultUnavailableKind,
  {
    readonly Icon: typeof FileQuestion;
    readonly title: string;
    readonly body: string;
    readonly action: string;
  }
> = {
  none: {
    Icon: FileQuestion,
    title: 'No eligibility result yet',
    body: 'Check your eligibility from your details to see your outcome and recommended loan.',
    action: 'Go to your details',
  },
  outdated: {
    Icon: Clock,
    title: 'Your result is out of date',
    body: 'You changed your details after your last check. Check your eligibility again to see an updated result.',
    action: 'Check eligibility again',
  },
};

/**
 * Empty or outdated result state with a call to action back into the journey.
 */
export const ResultUnavailable = ({ kind, onReturn }: ResultUnavailableProps) => {
  const { Icon, title, body, action } = content[kind];

  return (
    <section className={styles.panel} aria-labelledby="result-unavailable-heading">
      {/* Kind-specific icon */}
      <span className={styles.iconWrap}>
        <Icon className={styles.icon} size={20} aria-hidden="true" />
      </span>
      {/* Title, body, and return action */}
      <div className={styles.copy}>
        <h2 id="result-unavailable-heading" className={styles.title}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        <Button type="button" variant="primary" className={styles.action} onClick={onReturn}>
          {action}
        </Button>
      </div>
    </section>
  );
};

export default ResultUnavailable;
