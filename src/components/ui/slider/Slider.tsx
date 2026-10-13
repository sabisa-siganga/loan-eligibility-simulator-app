import { useId, type ChangeEventHandler, type ComponentPropsWithoutRef } from 'react';

import { HelperText } from '../helper-text';
import { Label } from '../label';
import styles from './Slider.module.scss';

export type SliderProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'onChange'> & {
  readonly label: string;
  readonly helperText?: string;
  readonly onChange?: ChangeEventHandler<HTMLInputElement>;
};

export const Slider = ({ id, label, helperText, className, onChange, ...props }: SliderProps) => {
  const generatedId = useId();
  const sliderId = id ?? generatedId;
  const helperId = helperText ? `${sliderId}-helper` : undefined;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <Label htmlFor={sliderId}>{label}</Label>
      <input
        id={sliderId}
        type="range"
        className={styles.slider}
        onChange={onChange}
        aria-describedby={helperId}
        {...props}
      />
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
    </div>
  );
};
