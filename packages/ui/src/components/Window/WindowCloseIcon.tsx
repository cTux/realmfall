import styles from './WindowCloseIcon.module.scss';

export interface WindowCloseIconProps {
  className?: string;
}

export function WindowCloseIcon({ className }: WindowCloseIconProps) {
  const classList = [styles.icon, className].filter(Boolean).join(' ');

  return <span className={classList} aria-hidden="true" />;
}
