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
  readonly offer: RecommendedLoanValues | null;
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

export const RecommendedLoanPanel = ({
  isEligible,
  productLabel,
  purposeLabel,
  requestedAmount,
  loanTermMonths,
  offer,
  className = '',
}: RecommendedLoanPanelProps) => {
  const monthlyDisplay = toDisplayMoney(offer?.monthlyPayment);

  const identityItems: ResultDetailItem[] = [
    { label: 'Product', value: productLabel || null },
    { label: 'Purpose', value: purposeLabel || null },
  ];

  const loanItems: ResultDetailItem[] = [
    { label: 'Requested amount', value: toDisplayMoney(requestedAmount) },
    ...(offer
      ? [
          { label: 'Recommended amount', value: toDisplayMoney(offer.recommendedAmount) },
          { label: 'Maximum amount', value: toDisplayMoney(offer.maxAmount) },
        ]
      : []),
    { label: 'Term', value: formatTermMonths(loanTermMonths) },
    ...(offer
      ? [
          { label: 'Annual interest', value: toDisplayPercent(offer.interestRate) },
          { label: 'Total repayment', value: toDisplayMoney(offer.totalRepayment) },
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

      {offer ? (
        <div className={styles.repaymentBlock}>
          <p className={styles.repaymentLabel}>Estimated monthly repayment</p>
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
      ) : (
        <p className={styles.noOffer}>
          {isEligible
            ? 'Recommendation details are not available for this result.'
            : 'No loan can be recommended based on this result.'}
        </p>
      )}

      <div className={styles.group}>
        <ResultDetailList items={identityItems} />
      </div>
      <div className={styles.group}>
        <ResultDetailList items={loanItems} />
      </div>
    </section>
  );
};

export default RecommendedLoanPanel;
