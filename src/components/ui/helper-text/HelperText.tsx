import type { ComponentPropsWithoutRef } from 'react';

import styles from './HelperText.module.scss';

export type HelperTextProps = ComponentPropsWithoutRef<'p'>;

export const HelperText = ({ children, className, ...props }: HelperTextProps) => (
  <p className={[styles.helperText, className].filter(Boolean).join(' ')} {...props}>
    {children}
  </p>
);
