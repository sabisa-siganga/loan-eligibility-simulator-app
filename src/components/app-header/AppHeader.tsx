import { Calculator } from 'lucide-react';

import styles from './AppHeader.module.scss';

export const AppHeader = () => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <p className={styles.brand}>
        <Calculator className={styles.icon} aria-hidden="true" size={22} strokeWidth={2} />
        <span>Loan Simulator</span>
      </p>
    </div>
  </header>
);

export default AppHeader;
