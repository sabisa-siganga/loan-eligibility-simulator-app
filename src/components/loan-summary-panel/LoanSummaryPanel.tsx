import type { ReactNode } from 'react';

import { Button, ErrorText } from '../ui';
import styles from './LoanSummaryPanel.module.scss';

export type LoanSummaryPanelProps = {
  readonly productLabel: string;
  readonly purposeLabel: string;
  readonly amountLabel: string;
  readonly termLabel: string;
  readonly isSubmitting?: boolean;
  readonly error?: string;
  readonly onAction: () => void;
  readonly disabled?: boolean;
  readonly notice?: ReactNode;
};

export const LoanSummaryPanel = ({
  productLabel,
  purposeLabel,
  amountLabel,
  termLabel,
  isSubmitting = false,
  error,
  onAction,
  disabled = false,
  notice,
}: LoanSummaryPanelProps) => {
  return (
    <aside className={styles.panel} aria-labelledby="loan-summary-heading">
      <h2 id="loan-summary-heading" className={styles.title}>
        Your loan summary
      </h2>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Product</dt>
          <dd>{productLabel}</dd>
        </div>
        <div className={styles.row}>
          <dt>Purpose</dt>
          <dd>{purposeLabel}</dd>
        </div>
        <div className={styles.row}>
          <dt>Amount</dt>
          <dd className={styles.amount}>{amountLabel}</dd>
        </div>
        <div className={styles.row}>
          <dt>Term</dt>
          <dd>{termLabel}</dd>
        </div>
      </dl>
      {notice}
      {error ? <ErrorText id="loan-summary-error">{error}</ErrorText> : null}
      <Button
        className={styles.action}
        type="button"
        onClick={onAction}
        disabled={disabled || isSubmitting}
        aria-describedby={error ? 'loan-summary-error' : undefined}
      >
        {isSubmitting ? 'Continuing…' : 'Continue to your details'}
      </Button>
    </aside>
  );
};

export default LoanSummaryPanel;
