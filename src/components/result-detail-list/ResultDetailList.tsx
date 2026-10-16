import styles from './ResultDetailList.module.scss';

export type ResultDetailItem = {
  readonly label: string;
  readonly value: string | null;
  readonly emphasis?: boolean;
  readonly swatchClassName?: string;
  readonly swatchKey?: string;
};

export type ResultDetailListProps = {
  readonly items: readonly ResultDetailItem[];
  readonly align?: 'start' | 'end';
};

const NOT_AVAILABLE = 'Not available';

export const ResultDetailList = ({ items, align = 'start' }: ResultDetailListProps) => {
  return (
    <dl className={styles.list}>
      {items.map((item) => {
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
