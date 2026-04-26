import styles from './LoadingSpinner.module.scss';

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={className ? `${styles.spinner} ${className}` : styles.spinner}
      aria-hidden="true"
    />
  );
}
