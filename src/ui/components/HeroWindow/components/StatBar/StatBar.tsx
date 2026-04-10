import { formatCompactNumber } from '../../../../formatters';
import type { StatBarProps } from './types';
import styles from './styles.module.css';

export function StatBar({ label, value, max, color }: StatBarProps) {
  const width = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));

  return (
    <div className={styles.barBlock}>
      <div className={styles.barLabel}>
        <span>{label}</span>
        <strong>
          {formatCompactNumber(value)}/{formatCompactNumber(max)}
        </strong>
      </div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${styles[color]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
