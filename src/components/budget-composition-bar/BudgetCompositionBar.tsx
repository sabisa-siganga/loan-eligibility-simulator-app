import { formatMoneyExact } from '../../utils/formatMoney';
import styles from './BudgetCompositionBar.module.scss';
import tones from './budgetCompositionTones.module.scss';

/** Properties for the stacked budget composition bar. */
export type BudgetCompositionBarProps = {
  readonly monthlyExpenses: number;
  readonly existingDebt: number;
  readonly newRepayment: number | null;
  readonly disposableIncome: number;
  readonly className?: string;
};

/** One coloured segment in the composition bar. */
type SegmentDefinition = {
  readonly key: string;
  readonly label: string;
  readonly amount: number;
  readonly toneClassName: string;
};

/** Clamps non-finite or negative amounts to zero for bar widths. */
const toNonNegative = (amount: number): number => {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }
  return amount;
};

/**
 * Builds bar segments from budget fields. Segment widths use flexGrow proportional
 * to amount so the bar fills the track; zero amounts are omitted later.
 */
const buildSegments = ({
  monthlyExpenses,
  existingDebt,
  newRepayment,
  disposableIncome,
}: BudgetCompositionBarProps): readonly SegmentDefinition[] => {
  const segments: SegmentDefinition[] = [
    {
      key: 'monthlyExpenses',
      label: 'Monthly expenses',
      amount: toNonNegative(monthlyExpenses),
      toneClassName: tones.toneExpenses,
    },
    {
      key: 'existingDebt',
      label: 'Existing monthly debt repayments',
      amount: toNonNegative(existingDebt),
      toneClassName: tones.toneDebt,
    },
  ];

  /** Include new repayment only when the caller provided a value. */
  if (newRepayment !== null) {
    segments.push({
      key: 'newRepayment',
      label: 'New repayment',
      amount: toNonNegative(newRepayment),
      toneClassName: tones.toneRepayment,
    });
  }

  segments.push({
    key: 'disposableIncome',
    label: 'Remaining monthly income',
    amount: toNonNegative(disposableIncome),
    toneClassName: tones.toneDisposable,
  });

  return segments;
};

/**
 * Horizontal bar of budget shares (expenses, debt, repayment, remaining income).
 * Renders nothing when every segment amount is zero.
 */
export const BudgetCompositionBar = ({
  monthlyExpenses,
  existingDebt,
  newRepayment,
  disposableIncome,
  className = '',
}: BudgetCompositionBarProps) => {
  const segments = buildSegments({
    monthlyExpenses,
    existingDebt,
    newRepayment,
    disposableIncome,
  });
  const total = segments.reduce((sum, segment) => sum + segment.amount, 0);

  /** Hide the bar when there is nothing to show. */
  if (total === 0) {
    return null;
  }

  /** Visible segments and accessible summary for the track. */
  const visibleSegments = segments.filter((segment) => segment.amount > 0);
  const ariaLabel = `Budget composition: ${visibleSegments
    .map((segment) => `${segment.label} ${formatMoneyExact(segment.amount)}`)
    .join(', ')}`;

  return (
    <div className={`${styles.track} ${className}`.trim()} role="img" aria-label={ariaLabel}>
      {/* One flex segment per positive budget share */}
      {visibleSegments.map((segment) => (
        <div
          key={segment.key}
          className={`${styles.segment} ${segment.toneClassName}`}
          style={{ flexGrow: segment.amount, flexBasis: 0 }}
          data-segment={segment.key}
          data-amount={segment.amount}
        />
      ))}
    </div>
  );
};

export default BudgetCompositionBar;
