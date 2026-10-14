import type { LoanProduct } from '../../types/api';
import { ErrorText } from '../ui';
import { MoneyInput } from '../money-input';
import { PurposeCard } from '../purpose-card';
import { WholeNumberInput } from '../whole-number-input';
import styles from './LoanProductSection.module.scss';

export type LoanProductSectionProps = {
  readonly product: LoanProduct;
  readonly purposeGroupName: string;
  readonly selectedPurposeId: string | null;
  readonly isSelected: boolean;
  readonly amountText: string;
  readonly termText: string;
  readonly amountHelperText: string;
  readonly termHelperText: string;
  readonly amountError?: string;
  readonly termError?: string;
  readonly purposeError?: string;
  readonly onPurposeChange: (purposeId: string) => void;
  readonly onAmountChange: (value: string) => void;
  readonly onTermChange: (value: string) => void;
  readonly onAmountBlur: () => void;
  readonly onTermBlur: () => void;
};

const getPurposePrompt = (product: LoanProduct): string => {
  if (product.id === 'vehicle_loan') {
    return 'What type of vehicle?';
  }
  return "What's the loan for?";
};

export const LoanProductSection = ({
  product,
  purposeGroupName,
  selectedPurposeId,
  isSelected,
  amountText,
  termText,
  amountHelperText,
  termHelperText,
  amountError,
  termError,
  purposeError,
  onPurposeChange,
  onAmountChange,
  onTermChange,
  onAmountBlur,
  onTermBlur,
}: LoanProductSectionProps) => {
  const headingId = `product-${product.id}-heading`;
  const purposeErrorId = `product-${product.id}-purpose-error`;
  const amountId = isSelected ? 'loan-amount' : `loan-amount-${product.id}`;
  const termId = isSelected ? 'loan-term' : `loan-term-${product.id}`;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.headingRow}>
        <h2 id={headingId} className={styles.heading}>
          {product.name}
        </h2>
        <span className={styles.headingRule} aria-hidden="true" />
      </div>

      <p className={styles.description}>{product.description}</p>

      <fieldset className={styles.purposeFieldset}>
        <legend className={styles.purposeLegend}>
          {getPurposePrompt(product)}{' '}
          <span aria-hidden="true">*</span>
        </legend>
        <div
          className={styles.purposeGrid}
          role="radiogroup"
          aria-labelledby={headingId}
          aria-describedby={purposeError ? purposeErrorId : undefined}
        >
          {product.purposes.map((purposeId) => (
            <PurposeCard
              key={purposeId}
              purposeId={purposeId}
              name={purposeGroupName}
              checked={selectedPurposeId === purposeId}
              onChange={onPurposeChange}
            />
          ))}
        </div>
      </fieldset>

      {purposeError ? <ErrorText id={purposeErrorId}>{purposeError}</ErrorText> : null}

      <div className={styles.fields}>
        <MoneyInput
          id={amountId}
          label="Required amount"
          value={isSelected ? amountText : ''}
          onChange={onAmountChange}
          onBlur={onAmountBlur}
          required={isSelected}
          disabled={!isSelected}
          helperText={amountHelperText}
          error={amountError}
        />
        <WholeNumberInput
          id={termId}
          label="Term"
          value={isSelected ? termText : ''}
          onChange={onTermChange}
          onBlur={onTermBlur}
          required={isSelected}
          disabled={!isSelected}
          placeholder="Enter term"
          suffix="months"
          helperText={termHelperText}
          helpText="The repayment period is the number of months you will take to repay the loan."
          error={termError}
        />
      </div>
    </section>
  );
};

export default LoanProductSection;
