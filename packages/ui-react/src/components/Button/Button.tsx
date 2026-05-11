import type { ButtonHTMLAttributes } from 'react';
import styles from './styles.module.scss';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'default' | 'small';
  tone?: 'default' | 'danger';
  unstyled?: boolean;
};

export function Button({
  type = 'button',
  children,
  className,
  size = 'default',
  tone = 'default',
  unstyled = false,
  ...props
}: ButtonProps) {
  const classList = [unstyled ? '' : styles.button, className]
    .filter(Boolean)
    .join(' ');
  const resolvedSize = size === 'default' ? undefined : size;
  const resolvedTone = tone === 'default' ? undefined : tone;

  return (
    <button
      type={type}
      className={classList}
      data-size={resolvedSize}
      data-tone={resolvedTone}
      {...props}
    >
      {children}
    </button>
  );
}
