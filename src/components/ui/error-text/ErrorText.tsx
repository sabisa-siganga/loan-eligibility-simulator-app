import type { ComponentPropsWithoutRef } from 'react';

import styles from './ErrorText.module.scss';

export type ErrorTextProps = ComponentPropsWithoutRef<'p'>;

export const ErrorText = ({ children, className, role = 'alert', ...props }: ErrorTextProps) => (
  <p className={[styles.errorText, className].filter(Boolean).join(' ')} role={role} {...props}>
    {children}
  </p>
);
