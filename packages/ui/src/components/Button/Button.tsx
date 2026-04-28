import type { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.scss';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  type = 'button',
  children,
  className,
  ...props
}: ButtonProps) {
  const classList = [styles.button, className].filter(Boolean).join(' ');

  return (
    <button type={type} className={classList} {...props}>
      {children}
    </button>
  );
}
