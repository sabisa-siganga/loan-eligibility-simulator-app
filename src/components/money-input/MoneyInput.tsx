import { useId, useState, type ChangeEvent, type FocusEventHandler } from 'react';

import {
  ErrorText,
  HelperText,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
} from '../ui';
import { CURRENCY_SYMBOL, formatMoneyInputDisplay } from '../../utils/formatMoney';
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

/** Digits-only storage; grouping/currency are display-only (see formatMoneyInputDisplay). */
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
  const showError = Boolean(error);
  const showHelper = Boolean(helperText) && !showError;
  const describedBy =
    [showHelper ? helperId : null, showError ? errorId : null].filter(Boolean).join(' ') ||
    undefined;
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeMoneyInput(event.target.value));
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = () => {
    setIsFocused(true);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  // While focused show raw digits for easy editing; blur applies grouping.
  const displayValue = isFocused || value === '' ? value : formatMoneyInputDisplay(value);

  return (
    <div className={styles.field}>
      <Label htmlFor={inputId} required={required && !disabled}>
        {label}
      </Label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{CURRENCY_SYMBOL}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={inputId}
          name={name}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required && !disabled ? true : undefined}
          aria-describedby={describedBy}
        />
      </InputGroup>
      {showHelper ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {showError ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
};

export default MoneyInput;
