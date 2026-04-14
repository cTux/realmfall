import { formatCompactNumber } from '../../../../formatters';
import type { StatBarProps } from './types';
import styles from './styles.module.scss';

export function StatBar({
  label,
  value,
  max,
  color,
  description,
  onHoverDetail,
  onLeaveDetail,
}: StatBarProps) {
  const width = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const formattedValue = `${formatCompactNumber(value)}/${formatCompactNumber(max)}`;

  return (
    <div className={styles.barBlock}>
      <div
        className={styles.barTrack}
        onMouseEnter={(event) =>
          description
            ? onHoverDetail?.(
                event,
                label,
                [{ kind: 'text', text: description }],
                'rgba(148, 163, 184, 0.9)',
              )
            : undefined
        }
        onMouseLeave={onLeaveDetail}
      >
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
