import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import styles from './InputGroup.module.scss';

export type InputGroupProps = ComponentPropsWithoutRef<'div'>;

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-group"
      className={[styles.group, className].filter(Boolean).join(' ')}
      {...props}
    />
  ),
);

InputGroup.displayName = 'InputGroup';

export type InputGroupInputProps = ComponentPropsWithoutRef<'input'>;

export const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      data-slot="input-group-control"
      className={[styles.control, className].filter(Boolean).join(' ')}
      {...props}
    />
  ),
);

InputGroupInput.displayName = 'InputGroupInput';

export type InputGroupAddonAlign = 'inline-start' | 'inline-end';

export type InputGroupAddonProps = ComponentPropsWithoutRef<'div'> & {
  readonly align?: InputGroupAddonAlign;
};

export const InputGroupAddon = ({
  align = 'inline-start',
  className,
  ...props
}: InputGroupAddonProps) => (
  <div
    data-slot="input-group-addon"
    data-align={align}
    className={[styles.addon, className].filter(Boolean).join(' ')}
    {...props}
  />
);

export type InputGroupTextProps = ComponentPropsWithoutRef<'span'>;

export const InputGroupText = ({ className, ...props }: InputGroupTextProps) => (
  <span
    data-slot="input-group-text"
    className={[styles.text, className].filter(Boolean).join(' ')}
    {...props}
  />
);
