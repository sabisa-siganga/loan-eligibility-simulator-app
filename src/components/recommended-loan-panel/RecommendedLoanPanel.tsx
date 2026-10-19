import { ResultDetailList, type ResultDetailItem } from '../result-detail-list';
import { formatMoneyExact } from '../../utils/formatMoney';
import { formatPercent } from '../../utils/formatPercent';
import styles from './RecommendedLoanPanel.module.scss';

export type RecommendedLoanValues = {
  readonly monthlyPayment: number;
  readonly recommendedAmount: number;
  readonly maxAmount: number;
  readonly interestRate: number;
  readonly totalRepayment: number;
};

export type RecommendedLoanPanelProps = {
  readonly isEligible: boolean;
  readonly productLabel: string;
  readonly purposeLabel: string;
  readonly requestedAmount: number;
  readonly loanTermMonths: number;
  /** Calculated loan figures; repayment may be present without a recommended offer. */
  readonly loanFigures: RecommendedLoanValues | null;
  readonly className?: string;
};

const NOT_AVAILABLE = 'Not available';

const formatTermMonths = (months: number): string =>
  months === 1 ? '1 month' : `${months} months`;

const toDisplayMoney = (amount: number | null | undefined): string | null => {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return null;
  }
  return formatMoneyExact(amount);
};

const toDisplayPercent = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return formatPercent(value);
};

const hasUsableRepayment = (figures: RecommendedLoanValues | null): boolean =>
  figures !== null && Number.isFinite(figures.monthlyPayment);

const hasRecommendedOffer = (
  isEligible: boolean,
  figures: RecommendedLoanValues | null,
): boolean =>
  isEligible && figures !== null && Number.isFinite(figures.recommendedAmount) && figures.recommendedAmount > 0;

export const RecommendedLoanPanel = ({
  isEligible,
  productLabel,
  purposeLabel,
  requestedAmount,
  loanTermMonths,
  loanFigures,
  className = '',
}: RecommendedLoanPanelProps) => {
  const showRepayment = hasUsableRepayment(loanFigures);
  const showOffer = hasRecommendedOffer(isEligible, loanFigures);
  const monthlyDisplay = toDisplayMoney(loanFigures?.monthlyPayment);

  const identityItems: ResultDetailItem[] = [
    { label: 'Product', value: productLabel || null },
    { label: 'Purpose', value: purposeLabel || null },
  ];

  const loanItems: ResultDetailItem[] = [
    { label: 'Requested amount', value: toDisplayMoney(requestedAmount) },
    ...(showOffer && loanFigures
      ? [
          { label: 'Recommended amount', value: toDisplayMoney(loanFigures.recommendedAmount) },
          {
            label: 'Maximum amount based on your budget',
            value: toDisplayMoney(loanFigures.maxAmount),
          },
        ]
      : []),
    { label: 'Term', value: formatTermMonths(loanTermMonths) },
    ...(loanFigures && showRepayment
      ? [
          { label: 'Annual interest', value: toDisplayPercent(loanFigures.interestRate) },
          { label: 'Total repayment', value: toDisplayMoney(loanFigures.totalRepayment) },
        ]
      : []),
  ];

  return (
    <section
      className={`${styles.panel} ${className}`.trim()}
      aria-labelledby="recommended-loan-heading"
    >
      <h2 id="recommended-loan-heading" className={styles.sectionTitle}>
        Recommended loan
      </h2>

      {showRepayment ? (
        <div className={styles.repaymentBlock}>
          <p className={styles.repaymentLabel}>Estimated repayment for your requested loan.</p>
          <p className={styles.repaymentValue}>
            {monthlyDisplay ? (
              <>
                <span className={styles.repaymentAmount}>{monthlyDisplay}</span>
                <span className={styles.repaymentUnit}>/ month</span>
              </>
            ) : (
              <span className={styles.repaymentUnavailable}>{NOT_AVAILABLE}</span>
            )}
          </p>
        </div>
      ) : null}

      {!showOffer ? (
        <p className={styles.noOffer}>
          {isEligible
            ? 'Recommendation details are not available for this result.'
            : 'No loan can be recommended based on this result.'}
        </p>
      ) : null}

      <div className={styles.group}>
        <ResultDetailList items={identityItems} />
      </div>
      <div className={styles.group}>
        <ResultDetailList items={loanItems} />
        {showOffer ? (
          <p className={styles.maxAmountNote}>
            This budget maximum may leave little or no remaining monthly income. It is not a
            comfortable borrowing recommendation.
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default RecommendedLoanPanel;
