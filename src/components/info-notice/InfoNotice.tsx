import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

import styles from './InfoNotice.module.scss';

export type InfoNoticeProps = {
  readonly children: ReactNode;
};

export const InfoNotice = ({ children }: InfoNoticeProps) => {
  return (
    <aside className={styles.notice} role="note">
      <Info className={styles.icon} size={24} aria-hidden="true" />
      <p className={styles.text}>{children}</p>
    </aside>
  );
};

export default InfoNotice;
