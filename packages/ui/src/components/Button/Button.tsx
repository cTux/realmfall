import type { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.scss';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  unstyled?: boolean;
};

export function Button({
  type = 'button',
  children,
  className,
  unstyled = false,
  ...props
}: ButtonProps) {
  const classList = [unstyled ? '' : styles.button, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classList} {...props}>
      {children}
    </button>
  );
}
