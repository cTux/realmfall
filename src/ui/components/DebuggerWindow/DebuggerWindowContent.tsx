import FPSStats from 'react-fps-stats';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.scss';

type DebuggerWindowContentProps = Pick<DebuggerWindowProps, 'timeLabel'>;

export function DebuggerWindowContent({
  timeLabel,
}: DebuggerWindowContentProps) {
  return (
    <div className={styles.panel} aria-label="Debugger">
      <strong className={styles.time}>{timeLabel}</strong>
      <div className={styles.graph}>
        <FPSStats
          top="auto"
          left="auto"
          right="auto"
          bottom="auto"
          graphWidth={220}
          graphHeight={72}
        />
      </div>
    </div>
  );
}
