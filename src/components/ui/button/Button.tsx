import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'link';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  readonly variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  soft: styles.soft,
  link: styles.link,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = 'button', variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={[styles.button, variantClassName[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
