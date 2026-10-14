import { getPurposeIcon, getPurposeLabel } from '../../utils/purposeLabels';
import styles from './PurposeCard.module.scss';

export type PurposeCardProps = {
  readonly purposeId: string;
  readonly name: string;
  readonly checked: boolean;
  readonly onChange: (purposeId: string) => void;
  readonly disabled?: boolean;
};

export const PurposeCard = ({
  purposeId,
  name,
  checked,
  onChange,
  disabled = false,
}: PurposeCardProps) => {
  const Icon = getPurposeIcon(purposeId);
  const label = getPurposeLabel(purposeId);
  const inputId = `${name}-${purposeId}`;

  return (
    <label
      className={[styles.card, checked ? styles.selected : null, disabled ? styles.disabled : null]
        .filter(Boolean)
        .join(' ')}
      htmlFor={inputId}
    >
      <input
        id={inputId}
        className={styles.input}
        type="radio"
        name={name}
        value={purposeId}
        checked={checked}
        disabled={disabled}
        onChange={() => {
          onChange(purposeId);
        }}
      />
      <Icon className={styles.icon} aria-hidden="true" size={20} strokeWidth={1.75} />
      <span className={styles.label}>{label}</span>
      <span className={styles.indicator} aria-hidden="true" />
    </label>
  );
};

export default PurposeCard;
