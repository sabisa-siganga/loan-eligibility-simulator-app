import styles from './ResultDetailList.module.scss';

/** One label/value row in a result detail list. */
export type ResultDetailItem = {
  readonly label: string;
  readonly value: string | null;
  readonly emphasis?: boolean;
  readonly swatchClassName?: string;
  readonly swatchKey?: string;
};

/** Properties for a definition-list of result detail rows. */
export type ResultDetailListProps = {
  readonly items: readonly ResultDetailItem[];
  readonly align?: 'start' | 'end';
};

const NOT_AVAILABLE = 'Not available';

/**
 * Definition list of labelled result values, with optional colour swatches.
 */
export const ResultDetailList = ({ items, align = 'start' }: ResultDetailListProps) => {
  return (
    <dl className={styles.list}>
      {items.map((item) => {
        /** Missing values use muted styling and a fallback label. */
        const isMissing = item.value === null;
        const valueClassName = [
          styles.value,
          align === 'end' ? styles.alignEnd : '',
          isMissing ? styles.muted : '',
          item.emphasis ? styles.emphasis : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={item.label} className={styles.row}>
            <dt className={styles.label}>
              {/* Optional legend swatch matching a budget bar segment */}
              {item.swatchClassName ? (
                <span
                  className={`${styles.swatch} ${item.swatchClassName}`}
                  data-swatch={item.swatchKey}
                  aria-hidden="true"
                />
              ) : null}
              {item.label}
            </dt>
            <dd className={valueClassName}>{isMissing ? NOT_AVAILABLE : item.value}</dd>
          </div>
        );
      })}
    </dl>
  );
};

export default ResultDetailList;
