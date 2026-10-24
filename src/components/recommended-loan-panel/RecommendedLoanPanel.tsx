import { ResultDetailList, type ResultDetailItem } from '../result-detail-list';
import { formatMoneyExact } from '../../utils/formatMoney';
import { formatPercent } from '../../utils/formatPercent';
import styles from './RecommendedLoanPanel.module.scss';

/** Calculated loan figures used by the recommended loan panel. */
export type RecommendedLoanValues = {
  readonly monthlyPayment: number;
  readonly recommendedAmount: number;
  readonly maxAmount: number;
  readonly interestRate: number;
  readonly totalRepayment: number;
};

/** Properties for the recommended loan summary on the result screen. */
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

/** Formats term length for display (singular versus plural months). */
const formatTermMonths = (months: number): string =>
  months === 1 ? '1 month' : `${months} months`;

/** Formats a finite amount for display, or null when missing/invalid. */
const toDisplayMoney = (amount: number | null | undefined): string | null => {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return null;
  }
  return formatMoneyExact(amount);
};

/** Formats a finite percent for display, or null when missing/invalid. */
const toDisplayPercent = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return formatPercent(value);
};

/** True when figures include a usable monthly repayment. */
const hasUsableRepayment = (figures: RecommendedLoanValues | null): boolean =>
  figures !== null && Number.isFinite(figures.monthlyPayment);

/** True when eligible and a positive recommended amount is available. */
const hasRecommendedOffer = (isEligible: boolean, figures: RecommendedLoanValues | null): boolean =>
  isEligible &&
  figures !== null &&
  Number.isFinite(figures.recommendedAmount) &&
  figures.recommendedAmount > 0;

/**
 * Result-screen panel: estimated repayment, offer messaging, and loan detail lists.
 */
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

  /** Product and purpose identity rows. */
  const identityItems: ResultDetailItem[] = [
    { label: 'Product', value: productLabel || null },
    { label: 'Purpose', value: purposeLabel || null },
  ];

  /** Amount, term, and optional offer / repayment rows. */
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

      {/* Estimated monthly repayment for the requested loan */}
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

      {/* Message when no recommended offer can be shown */}
      {!showOffer ? (
        <p className={styles.noOffer}>
          {isEligible
            ? 'Recommendation details are not available for this result.'
            : 'No loan can be recommended based on this result.'}
        </p>
      ) : null}

      {/* Product / purpose */}
      <div className={styles.group}>
        <ResultDetailList items={identityItems} />
      </div>
      {/* Loan figures and optional budget-maximum note */}
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
