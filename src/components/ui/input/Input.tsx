import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import styles from './Input.module.scss';

export type InputProps = ComponentPropsWithoutRef<'input'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={[styles.input, className].filter(Boolean).join(' ')} {...props} />
));

Input.displayName = 'Input';
