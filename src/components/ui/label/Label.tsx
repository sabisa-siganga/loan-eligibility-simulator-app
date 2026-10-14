import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import styles from './Label.module.scss';

export type LabelProps = ComponentPropsWithoutRef<'label'> & {
  readonly required?: boolean;
};

export const Label = ({
  children,
  className,
  required = false,
  ...props
}: LabelProps): ReactElement => (
  <label className={[styles.label, className].filter(Boolean).join(' ')} {...props}>
    {children}
    {required ? (
      <span className={styles.required} aria-hidden="true">
        *
      </span>
    ) : null}
  </label>
);
