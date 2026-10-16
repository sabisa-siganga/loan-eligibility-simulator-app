import { formatMoneyExact } from '../../utils/formatMoney';
import styles from './BudgetCompositionBar.module.scss';
import tones from './budgetCompositionTones.module.scss';

export type BudgetCompositionBarProps = {
  readonly monthlyExpenses: number;
  readonly existingDebt: number;
  readonly newRepayment: number | null;
  readonly disposableIncome: number;
  readonly className?: string;
};

type SegmentDefinition = {
  readonly key: string;
  readonly label: string;
  readonly amount: number;
  readonly toneClassName: string;
};

const toNonNegative = (amount: number): number => {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }
  return amount;
};

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
      label: 'Existing debt',
      amount: toNonNegative(existingDebt),
      toneClassName: tones.toneDebt,
    },
  ];

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
    label: 'Disposable income',
    amount: toNonNegative(disposableIncome),
    toneClassName: tones.toneDisposable,
  });

  return segments;
};

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

  if (total === 0) {
    return null;
  }

  const visibleSegments = segments.filter((segment) => segment.amount > 0);
  const ariaLabel = `Budget composition: ${visibleSegments
    .map((segment) => `${segment.label} ${formatMoneyExact(segment.amount)}`)
    .join(', ')}`;

  return (
    <div className={`${styles.track} ${className}`.trim()} role="img" aria-label={ariaLabel}>
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
