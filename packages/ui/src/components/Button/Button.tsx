import type { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.scss';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'default' | 'small';
  unstyled?: boolean;
};

export function Button({
  type = 'button',
  children,
  className,
  size = 'default',
  unstyled = false,
  ...props
}: ButtonProps) {
  const classList = [unstyled ? '' : styles.button, className]
    .filter(Boolean)
    .join(' ');
  const resolvedSize = size === 'default' ? undefined : size;

  return (
    <button
      type={type}
      className={classList}
      data-size={resolvedSize}
      {...props}
    >
      {children}
    </button>
  );
}
