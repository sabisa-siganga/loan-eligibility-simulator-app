import { Calculator } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog } from '../ui';
import styles from './AppHeader.module.scss';

/** App brand bar with a “How it works” help dialog. */
export const AppHeader = () => {
  /** Controls whether the help dialog is open. */
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <header className={styles.header}>
      {/* Brand and help trigger */}
      <div className={styles.inner}>
        <p className={styles.brand}>
          <Calculator className={styles.icon} aria-hidden="true" size={22} strokeWidth={2} />
          <span>Loan Simulator</span>
        </p>
        <Button
          type="button"
          variant="link"
          className={styles.helpButton}
          aria-haspopup="dialog"
          aria-expanded={isHelpOpen}
          onClick={() => {
            setIsHelpOpen(true);
          }}
        >
          How it works
        </Button>
      </div>

      {/* Help dialog: journey overview and tips */}
      <Dialog
        open={isHelpOpen}
        title="How it works"
        onClose={() => {
          setIsHelpOpen(false);
        }}
      >
        <div className={styles.helpContent}>
          <ol className={styles.helpSteps}>
            <li>Choose your loan type, purpose, amount and term.</li>
            <li>Enter your budget and circumstances, including take-home income.</li>
            <li>Review your eligibility result, then adjust amount or term if you need to.</li>
          </ol>
          <p>
            Use take-home income so the estimate reflects money you actually receive. Avoid counting
            the same debt cost twice when you enter existing repayments.
          </p>
          <p>
            Interest and term both change your monthly repayment and total cost. This estimate
            excludes fees and insurance.
          </p>
          <p>Select Start again to clear your entered details and return to the first step.</p>
        </div>
      </Dialog>
    </header>
  );
};

export default AppHeader;
