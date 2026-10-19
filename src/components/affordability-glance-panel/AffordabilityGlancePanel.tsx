import type { RiskCategory } from '../../types/api';
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
  readonly loanToIncomeRatio: number | null;
  readonly affordabilityScore: string;
  readonly approvalLikelihood: number | null;
  readonly riskCategory: RiskCategory | null;
  readonly className?: string;
};

const APPROVAL_ESTIMATE_HELPER =
  "This estimate uses mock rules for this simulator. It is not a lender's approval probability or a guarantee of approval. It is based on the credit score only and does not include affordability.";

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
  const approvalDisplay =
    approvalLikelihood === null || !Number.isFinite(approvalLikelihood)
      ? null
      : formatPercent(approvalLikelihood);
  const ltiDisplay =
    loanToIncomeRatio === null || !Number.isFinite(loanToIncomeRatio)
      ? null
      : formatPercent(loanToIncomeRatio);

  return (
    <section
      className={`${styles.panel} ${className}`.trim()}
      aria-labelledby="affordability-heading"
    >
      <h2 id="affordability-heading" className={styles.sectionTitle}>
        Affordability at a glance
      </h2>

      <dl className={styles.incomeRow}>
        <dt className={styles.incomeLabel}>Monthly take-home income</dt>
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
              label: 'Remaining monthly income',
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
          {ltiDisplay === null ? (
            <StatusCircle
              status="Not available"
              label="Requested loan-to-annual-income ratio"
              tone="neutral"
            />
          ) : (
            <CircularProgressRing
              value={loanToIncomeRatio as number}
              label="Requested loan-to-annual-income ratio"
              displayValue={ltiDisplay}
              animationDelayMs={80}
            />
          )}
          <StatusCircle
            status={affordabilityLabel}
            label="Affordability rating"
            tone={affordabilityTone}
          />
          {approvalDisplay === null ? (
            <StatusCircle
              status="Not available"
              label="Simulated approval estimate"
              tone="neutral"
            />
          ) : (
            <CircularProgressRing
              value={approvalLikelihood as number}
              label="Simulated approval estimate"
              displayValue={approvalDisplay}
              animationDelayMs={160}
            />
          )}
        </div>
        <p className={styles.approvalHelper}>{APPROVAL_ESTIMATE_HELPER}</p>
      </div>

      <div className={styles.riskBlock}>
        <p className={styles.riskLabel} id="overall-risk-label">
          Overall risk
        </p>
        <p
          className={`${styles.riskBadge} ${riskToneClassName[riskTone]}`}
          role="status"
          aria-labelledby="overall-risk-label"
        >
          {riskLabel}
        </p>
      </div>
    </section>
  );
};

export default AffordabilityGlancePanel;
