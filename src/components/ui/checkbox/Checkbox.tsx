import { useId, type ChangeEventHandler, type ComponentPropsWithoutRef } from 'react';

import { ErrorText } from '../error-text';
import { HelperText } from '../helper-text';
import styles from './Checkbox.module.scss';

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'onChange' | 'checked'
> & {
  readonly label: string;
  readonly checked?: boolean;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly onChange?: ChangeEventHandler<HTMLInputElement>;
};

export const Checkbox = ({
  id,
  label,
  checked,
  helperText,
  errorText,
  required = false,
  className,
  onChange,
  ...props
}: CheckboxProps) => {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const helperId = helperText ? `${checkboxId}-helper` : undefined;
  const errorId = errorText ? `${checkboxId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;
  const isInvalid = Boolean(errorText);

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          className={styles.control}
          checked={checked}
          onChange={onChange}
          required={required}
          aria-required={required || undefined}
          aria-invalid={isInvalid ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        <span className={styles.labelText}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      </label>
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {errorText ? <ErrorText id={errorId}>{errorText}</ErrorText> : null}
    </div>
  );
};
