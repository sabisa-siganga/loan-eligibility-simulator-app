import type { ReactNode } from 'react';

import { Button, ErrorText, HelperText } from '../ui';
import type { PrimaryActionMode } from '../../store';
import styles from './LoanSummaryPanel.module.scss';

export type LoanSummaryPanelProps = {
  readonly productLabel: string;
  readonly purposeLabel: string;
  readonly amountLabel: string;
  readonly termLabel: string;
  readonly creditScoreLabel: string;
  readonly actionMode: PrimaryActionMode;
  readonly isSubmitting?: boolean;
  readonly error?: string;
  readonly onAction: () => void;
  readonly disabled?: boolean;
  readonly notice?: ReactNode;
};

const actionLabels: Record<PrimaryActionMode, { idle: string; busy: string }> = {
  calculate: { idle: 'Calculate repayment', busy: 'Calculating…' },
  recalculate: { idle: 'Recalculate repayment', busy: 'Recalculating…' },
  continue: { idle: 'Continue to your details', busy: 'Continue to your details' },
};

export const LoanSummaryPanel = ({
  productLabel,
  purposeLabel,
  amountLabel,
  termLabel,
  creditScoreLabel,
  actionMode,
  isSubmitting = false,
  error,
  onAction,
  disabled = false,
  notice,
}: LoanSummaryPanelProps) => {
  const labels = actionLabels[actionMode];

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
        <div className={styles.row}>
          <dt>Credit score</dt>
          <dd>{creditScoreLabel}</dd>
        </div>
      </dl>
      {actionMode === 'recalculate' ? (
        <HelperText>Your repayment estimate needs updating before you continue.</HelperText>
      ) : null}
      {notice}
      {error ? <ErrorText id="loan-summary-error">{error}</ErrorText> : null}
      <Button
        className={styles.action}
        type="button"
        onClick={onAction}
        disabled={disabled || isSubmitting}
        aria-describedby={error ? 'loan-summary-error' : undefined}
      >
        {isSubmitting ? labels.busy : labels.idle}
      </Button>
      <p className={styles.footer}>Your repayment estimate will appear on the next step.</p>
    </aside>
  );
};

export default LoanSummaryPanel;
