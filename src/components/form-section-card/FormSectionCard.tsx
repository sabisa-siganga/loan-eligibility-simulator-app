import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import styles from './FormSectionCard.module.scss';

export type FormSectionCardProps = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly children: ReactNode;
};

export const FormSectionCard = ({ icon: Icon, title, children }: FormSectionCardProps) => {
  const headingId = useId();

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <header className={styles.header}>
        <span className={styles.iconBadge} aria-hidden="true">
          <Icon className={styles.icon} size={20} strokeWidth={1.75} />
        </span>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
};

export default FormSectionCard;
