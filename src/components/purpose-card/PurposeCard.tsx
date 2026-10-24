import { type KeyboardEvent as ReactKeyboardEvent } from 'react';

import { getPurposeIcon, getPurposeLabel } from '../../utils/purposeLabels';
import styles from './PurposeCard.module.scss';

/** Properties for a selectable loan-purpose radio card. */
export type PurposeCardProps = {
  readonly purposeId: string;
  readonly name: string;
  readonly checked: boolean;
  readonly onChange: (purposeId: string) => void;
  readonly disabled?: boolean;
  readonly required?: boolean;
};

/** Move focus and selection to the next/previous radio in the same group. */
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

/**
 * Purpose option as a focusable card wrapping a visually hidden radio input.
 */
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

  /** Space/Enter select; arrow keys move within the radio group. */
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
      {/* Native radio for form semantics; card handles keyboard UX */}
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
