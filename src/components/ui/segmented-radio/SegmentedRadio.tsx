import { useId } from 'react';

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
            >
              <input
                id={optionId}
                className={styles.input}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={disabled}
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
