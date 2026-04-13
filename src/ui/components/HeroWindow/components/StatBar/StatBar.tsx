import { formatCompactNumber } from '../../../../formatters';
import type { StatBarProps } from './types';
import styles from './styles.module.scss';

export function StatBar({ label, value, max, color }: StatBarProps) {
  const width = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const formattedValue = `${formatCompactNumber(value)}/${formatCompactNumber(max)}`;

  return (
    <div className={styles.barBlock}>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${styles[color]}`}
          style={{ width: `${width}%` }}
        />
        <div className={styles.barContent}>
          <span>{label}</span>
          <strong>{formattedValue}</strong>
        </div>
      </div>
    </div>
  );
}
