import { useId, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import { HelperText } from '../helper-text';
import styles from './SegmentedRadio.module.scss';

export type SegmentedRadioOption<T extends string = string> = {
  readonly value: T;
  readonly label: string;
};

export type SegmentedRadioProps<T extends string = string> = {
  readonly name: string;
  readonly options: readonly SegmentedRadioOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly disabled?: boolean;
  readonly helperText?: string;
  readonly 'aria-label'?: string;
  readonly className?: string;
};

const focusSiblingOption = ({
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

export const SegmentedRadio = <T extends string>({
  name,
  options,
  value,
  onChange,
  disabled = false,
  helperText,
  'aria-label': ariaLabel,
  className,
}: SegmentedRadioProps<T>) => {
  const generatedId = useId();
  const helperId = helperText ? `${generatedId}-helper` : undefined;

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLLabelElement>,
    optionValue: T,
    optionId: string,
  ) => {
    if (disabled) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange(optionValue);
      return;
    }

    const input = document.getElementById(optionId);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      focusSiblingOption({ currentInput: input, direction: 1 });
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      focusSiblingOption({ currentInput: input, direction: -1 });
    }
  };

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div
        className={styles.group}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-describedby={helperId}
        aria-disabled={disabled || undefined}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={[
                styles.option,
                isSelected ? styles.selected : null,
                disabled ? styles.disabled : null,
              ]
                .filter(Boolean)
                .join(' ')}
              htmlFor={optionId}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(event) => {
                handleOptionKeyDown(event, option.value, optionId);
              }}
            >
              <input
                id={optionId}
                className={styles.input}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                tabIndex={-1}
                onChange={() => {
                  onChange(option.value);
                }}
              />
              <span className={styles.label}>{option.label}</span>
            </label>
          );
        })}
      </div>
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
    </div>
  );
};
