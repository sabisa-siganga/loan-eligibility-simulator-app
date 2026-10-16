import { type KeyboardEvent as ReactKeyboardEvent } from 'react';

import { getPurposeIcon, getPurposeLabel } from '../../utils/purposeLabels';
import styles from './PurposeCard.module.scss';

export type PurposeCardProps = {
  readonly purposeId: string;
  readonly name: string;
  readonly checked: boolean;
  readonly onChange: (purposeId: string) => void;
  readonly disabled?: boolean;
  readonly required?: boolean;
};

const focusSiblingCard = ({
  currentInput,
  direction,
}: {
  readonly currentInput: HTMLInputElement;
  readonly direction: 1 | -1;
}) => {
  const group = Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${currentInput.name}"]`),
  ).filter((input) => !input.disabled);

  if (group.length === 0) {
    return;
  }

  const currentIndex = group.indexOf(currentInput);
  if (currentIndex < 0) {
    return;
  }

  const nextIndex = (currentIndex + direction + group.length) % group.length;
  const nextInput = group[nextIndex];
  const nextLabel = nextInput.closest('label');
  nextInput.click();
  nextLabel?.focus();
};

export const PurposeCard = ({
  purposeId,
  name,
  checked,
  onChange,
  disabled = false,
  required = false,
}: PurposeCardProps) => {
  const Icon = getPurposeIcon(purposeId);
  const label = getPurposeLabel(purposeId);
  const inputId = `${name}-${purposeId}`;

  const handleCardKeyDown = (event: ReactKeyboardEvent<HTMLLabelElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange(purposeId);
      return;
    }

    const input = document.getElementById(inputId);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      focusSiblingCard({ currentInput: input, direction: 1 });
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      focusSiblingCard({ currentInput: input, direction: -1 });
    }
  };

  return (
    <label
      className={[styles.card, checked ? styles.selected : null, disabled ? styles.disabled : null]
        .filter(Boolean)
        .join(' ')}
      htmlFor={inputId}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleCardKeyDown}
    >
      <input
        id={inputId}
        className={styles.input}
        type="radio"
        name={name}
        value={purposeId}
        checked={checked}
        disabled={disabled}
        required={required}
        tabIndex={-1}
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
