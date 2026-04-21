import styles from './PauseOverlay.module.scss';

interface PauseOverlayProps {
  title: string;
  subtitle: string;
}

export function PauseOverlay({ title, subtitle }: PauseOverlayProps) {
  return (
    <div
      className={styles.overlay}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div className={styles.card}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
