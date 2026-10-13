import { useId, type ChangeEventHandler, type ComponentPropsWithoutRef } from 'react';

import { ErrorText } from '../error-text';
import { HelperText } from '../helper-text';
import { Label } from '../label';
import styles from './Select.module.scss';

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export type SelectProps = Omit<ComponentPropsWithoutRef<'select'>, 'onChange'> & {
  readonly label: string;
  readonly options: readonly SelectOption[];
  readonly helperText?: string;
  readonly errorText?: string;
  readonly onChange?: ChangeEventHandler<HTMLSelectElement>;
};

export const Select = ({
  id,
  label,
  options,
  helperText,
  errorText,
  required = false,
  className,
  value,
  onChange,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const errorId = errorText ? `${selectId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;
  const isInvalid = Boolean(errorText);

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <Label htmlFor={selectId} required={required}>
        {label}
      </Label>
      <select
        id={selectId}
        className={styles.select}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required || undefined}
        aria-invalid={isInvalid ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {errorText ? <ErrorText id={errorId}>{errorText}</ErrorText> : null}
    </div>
  );
};
