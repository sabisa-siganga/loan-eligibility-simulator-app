import { useId, type ChangeEvent, type FocusEventHandler } from 'react';

import { ErrorText, HelperText, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, Label } from '../ui';
import { CURRENCY_SYMBOL } from '../../utils/formatMoney';
import styles from './MoneyInput.module.scss';

export type MoneyInputProps = {
  readonly id?: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: FocusEventHandler<HTMLInputElement>;
  readonly helperText?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly name?: string;
};

const sanitizeMoneyInput = (raw: string): string => raw.replace(/[^\d]/g, '');

export const MoneyInput = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  helperText,
  error,
  required = false,
  disabled = false,
  placeholder = 'Enter amount',
  name,
}: MoneyInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = [helperText ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeMoneyInput(event.target.value));
  };

  return (
    <div className={styles.field}>
      <Label htmlFor={inputId} required={required && !disabled}>
        {label}
      </Label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText aria-hidden="true">{CURRENCY_SYMBOL}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={inputId}
          name={name}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required && !disabled ? true : undefined}
          aria-describedby={describedBy}
        />
      </InputGroup>
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
};

export default MoneyInput;
