import FPSStats from 'react-fps-stats';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.css';

type DebuggerWindowContentProps = Pick<
  DebuggerWindowProps,
  'timeLabel' | 'onTriggerEarthshake'
>;

export function DebuggerWindowContent({
  timeLabel,
  onTriggerEarthshake,
}: DebuggerWindowContentProps) {
  return (
    <div className={styles.panel} aria-label="Debugger">
      <strong className={styles.time}>{timeLabel}</strong>
      <button
        type="button"
        className={styles.button}
        onClick={onTriggerEarthshake}
      >
        Trigger earthshake
      </button>
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
