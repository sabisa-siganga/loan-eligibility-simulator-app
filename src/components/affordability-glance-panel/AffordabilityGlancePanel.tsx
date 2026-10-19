import { BudgetCompositionBar, budgetCompositionTones as tones } from '../budget-composition-bar';
import { CircularProgressRing, StatusCircle } from '../circular-progress-ring';
import { ResultDetailList } from '../result-detail-list';
import {
  getAffordabilityRatingLabel,
  getAffordabilityRatingTone,
} from '../../utils/affordabilityRatingLabels';
import { formatMoneyExact } from '../../utils/formatMoney';
import { formatPercent } from '../../utils/formatPercent';
import { getRiskCategoryLabel, getRiskCategoryTone } from '../../utils/riskCategoryLabels';
import styles from './AffordabilityGlancePanel.module.scss';

export type AffordabilityGlancePanelProps = {
  readonly monthlyIncome: number;
  readonly monthlyExpenses: number;
  readonly existingDebt: number;
  readonly newRepayment: number | null;
  readonly disposableIncome: number;
  readonly debtToIncomeRatio: number;
  readonly loanToIncomeRatio: number;
  readonly affordabilityScore: string;
  readonly approvalLikelihood: number;
  readonly riskCategory: string;
  readonly className?: string;
};

const riskToneClassName: Record<ReturnType<typeof getRiskCategoryTone>, string> = {
  low: styles.riskToneLow,
  medium: styles.riskToneMedium,
  high: styles.riskToneHigh,
  unknown: styles.riskToneUnknown,
};

const toDisplayMoney = (amount: number | null): string | null => {
  if (amount === null || !Number.isFinite(amount)) {
    return null;
  }
  return formatMoneyExact(amount);
};

export const AffordabilityGlancePanel = ({
  monthlyIncome,
  monthlyExpenses,
  existingDebt,
  newRepayment,
  disposableIncome,
  debtToIncomeRatio,
  loanToIncomeRatio,
  affordabilityScore,
  approvalLikelihood,
  riskCategory,
  className = '',
}: AffordabilityGlancePanelProps) => {
  const affordabilityLabel = getAffordabilityRatingLabel(affordabilityScore);
  const affordabilityTone = getAffordabilityRatingTone(affordabilityScore);
  const riskLabel = getRiskCategoryLabel(riskCategory);
  const riskTone = getRiskCategoryTone(riskCategory);
  const incomeDisplay = toDisplayMoney(monthlyIncome);

  return (
    <section
      className={`${styles.panel} ${className}`.trim()}
      aria-labelledby="affordability-heading"
    >
      <h2 id="affordability-heading" className={styles.sectionTitle}>
        Affordability at a glance
      </h2>

      <dl className={styles.incomeRow}>
        <dt className={styles.incomeLabel}>Monthly income</dt>
        <dd className={incomeDisplay ? styles.incomeValue : styles.incomeMissing}>
          {incomeDisplay ?? 'Not available'}
        </dd>
      </dl>

      <BudgetCompositionBar
        monthlyExpenses={monthlyExpenses}
        existingDebt={existingDebt}
        newRepayment={newRepayment}
        disposableIncome={disposableIncome}
      />

      <div className={styles.breakdown}>
        <ResultDetailList
          align="end"
          items={[
            {
              label: 'Monthly expenses',
              value: toDisplayMoney(monthlyExpenses),
              swatchClassName: tones.toneExpenses,
              swatchKey: 'monthlyExpenses',
            },
            {
              label: 'Existing monthly debt repayments',
              value: toDisplayMoney(existingDebt),
              swatchClassName: tones.toneDebt,
              swatchKey: 'existingDebt',
            },
            {
              label: 'New repayment',
              value: toDisplayMoney(newRepayment),
              swatchClassName: tones.toneRepayment,
              swatchKey: 'newRepayment',
            },
            {
              label: 'Disposable income',
              value: toDisplayMoney(disposableIncome),
              emphasis: true,
              swatchClassName: tones.toneDisposable,
              swatchKey: 'disposableIncome',
            },
          ]}
        />
      </div>

      <div className={styles.indicators}>
        <h3 className={styles.indicatorsHeading}>Affordability indicators</h3>
        <div className={styles.indicatorGrid}>
          <CircularProgressRing
            value={debtToIncomeRatio}
            label="Debt-to-income ratio"
            displayValue={formatPercent(debtToIncomeRatio)}
            animationDelayMs={0}
          />
          <CircularProgressRing
            value={loanToIncomeRatio}
            label="Loan-to-annual-income"
            displayValue={formatPercent(loanToIncomeRatio)}
            animationDelayMs={80}
          />
          <StatusCircle
            status={affordabilityLabel}
            label="Affordability rating"
            tone={affordabilityTone}
          />
          <CircularProgressRing
            value={approvalLikelihood}
            label="Approval likelihood"
            displayValue={formatPercent(approvalLikelihood)}
            animationDelayMs={160}
          />
        </div>
      </div>

      <div className={styles.riskBlock}>
        <p className={styles.riskLabel}>Risk category</p>
        <p className={`${styles.riskBadge} ${riskToneClassName[riskTone]}`}>{riskLabel}</p>
      </div>
    </section>
  );
};

export default AffordabilityGlancePanel;
