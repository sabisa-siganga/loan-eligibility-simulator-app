import { ChevronDown } from 'lucide-react';

import type { LoanProduct } from '../../types/api';
import { getProductIcon } from '../../utils/productIcons';
import { ErrorText } from '../ui';
import { MoneyInput } from '../money-input';
import { PurposeCard } from '../purpose-card';
import { WholeNumberInput } from '../whole-number-input';
import styles from './LoanProductSection.module.scss';

/** Properties for one expandable loan product accordion section. */
export type LoanProductSectionProps = {
  readonly product: LoanProduct;
  readonly purposeGroupName: string;
  readonly selectedPurposeId: string | null;
  readonly isExpanded: boolean;
  readonly isSelected: boolean;
  readonly amountText: string;
  readonly termText: string;
  readonly amountHelperText: string;
  readonly termHelperText: string;
  readonly amountError?: string;
  readonly termError?: string;
  readonly purposeError?: string;
  readonly onHeaderClick: () => void;
  readonly onPurposeChange: (purposeId: string) => void;
  readonly onAmountChange: (value: string) => void;
  readonly onTermChange: (value: string) => void;
  readonly onAmountBlur: () => void;
  readonly onTermBlur: () => void;
};

/** Purpose legend copy; vehicle loans use a vehicle-specific prompt. */
const getPurposePrompt = (product: LoanProduct): string => {
  if (product.id === 'vehicle_loan') {
    return 'What type of vehicle?';
  }
  return "What's the loan for?";
};

/**
 * Expandable product block: header, purpose radios, and amount/term when selected.
 */
export const LoanProductSection = ({
  product,
  purposeGroupName,
  selectedPurposeId,
  isExpanded,
  isSelected,
  amountText,
  termText,
  amountHelperText,
  termHelperText,
  amountError,
  termError,
  purposeError,
  onHeaderClick,
  onPurposeChange,
  onAmountChange,
  onTermChange,
  onAmountBlur,
  onTermBlur,
}: LoanProductSectionProps) => {
  /** Stable identifiers for heading, panel, and purpose accessibility wiring. */
  const headingId = `product-${product.id}-heading`;
  const descriptionId = `product-${product.id}-description`;
  const panelId = `product-${product.id}-panel`;
  const purposeLegendId = `product-${product.id}-purpose-legend`;
  const purposeErrorId = `product-${product.id}-purpose-error`;
  const showFields = isExpanded && isSelected;
  const ProductIcon = getProductIcon(product.id);

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      {/* Expand/collapse header and product description */}
      <div className={styles.headerBlock}>
        <button
          type="button"
          className={styles.headerButton}
          aria-labelledby={headingId}
          aria-describedby={descriptionId}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={onHeaderClick}
        >
          <ProductIcon
            className={styles.productIcon}
            aria-hidden="true"
            size={30}
            strokeWidth={1.75}
          />
          <span className={styles.headerTop}>
            <h2 id={headingId} className={styles.heading}>
              {product.name}
            </h2>
            <span className={styles.headingRule} aria-hidden="true" />
            <ChevronDown
              className={[styles.chevron, isExpanded ? styles.chevronExpanded : null]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
              size={20}
              strokeWidth={1.75}
            />
          </span>
        </button>
        <p id={descriptionId} className={styles.description}>
          {product.description}
        </p>
      </div>

      {/* Expanded panel: purpose and loan fields */}
      <div id={panelId} className={styles.panel} hidden={!isExpanded}>
        {isExpanded ? (
          <>
            {/* Purpose radio group */}
            <div className={styles.purposeFieldset}>
              <p id={purposeLegendId} className={styles.purposeLegend}>
                {getPurposePrompt(product)} <span aria-hidden="true">*</span>
              </p>
              <div
                className={styles.purposeGrid}
                role="radiogroup"
                aria-labelledby={purposeLegendId}
                aria-required="true"
                aria-invalid={purposeError ? 'true' : undefined}
                aria-describedby={purposeError ? purposeErrorId : undefined}
              >
                {product.purposes.map((purposeId) => (
                  <PurposeCard
                    key={purposeId}
                    purposeId={purposeId}
                    name={purposeGroupName}
                    checked={selectedPurposeId === purposeId}
                    required
                    onChange={onPurposeChange}
                  />
                ))}
              </div>
            </div>

            {/* Purpose validation message */}
            {purposeError ? <ErrorText id={purposeErrorId}>{purposeError}</ErrorText> : null}

            {/* Amount and term once this product is selected */}
            {showFields ? (
              <div className={styles.fields}>
                <MoneyInput
                  id="loan-amount"
                  label="Required amount"
                  value={amountText}
                  onChange={onAmountChange}
                  onBlur={onAmountBlur}
                  required
                  helperText={amountHelperText}
                  error={amountError}
                />
                <WholeNumberInput
                  id="loan-term"
                  label="Term"
                  value={termText}
                  onChange={onTermChange}
                  onBlur={onTermBlur}
                  required
                  placeholder="Enter term"
                  suffix="months"
                  helperText={termHelperText}
                  helpText="The repayment period is the number of months you will take to repay the loan."
                  error={termError}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
};

export default LoanProductSection;
