import { CircleHelp } from 'lucide-react';
import { useId, type ChangeEvent, type FocusEventHandler, type ReactNode } from 'react';

import {
  ErrorText,
  HelperText,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
} from '../ui';
import styles from './WholeNumberInput.module.scss';

export type WholeNumberInputProps = {
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
  readonly suffix?: string;
  readonly helpText?: string;
  readonly trailing?: ReactNode;
};

const sanitizeWholeNumber = (raw: string): string => raw.replace(/[^\d]/g, '');

export const WholeNumberInput = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  helperText,
  error,
  required = false,
  disabled = false,
  placeholder,
  name,
  suffix,
  helpText,
}: WholeNumberInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const showError = Boolean(error);
  const showHelper = Boolean(helperText) && !showError;
  const describedBy =
    [showHelper ? helperId : null, showError ? errorId : null, helpText ? helpId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeWholeNumber(event.target.value));
  };

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <Label htmlFor={inputId} required={required && !disabled}>
          {label}
        </Label>
        {helpText ? (
          <span className={styles.help} title={helpText}>
            <CircleHelp aria-hidden="true" size={16} strokeWidth={2} />
            <span id={helpId} className="visually-hidden">
              {helpText}
            </span>
          </span>
        ) : null}
      </div>
      <InputGroup>
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
        {suffix ? (
          <InputGroupAddon align="inline-end">
            <InputGroupText aria-hidden="true">{suffix}</InputGroupText>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {showHelper ? <HelperText id={helperId}>{helperText}</HelperText> : null}
      {showError ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
};

export default WholeNumberInput;
