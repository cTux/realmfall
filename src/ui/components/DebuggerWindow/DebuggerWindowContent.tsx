import FPSStats from 'react-fps-stats';
import { CalendarTimestamp } from '../CalendarTimestamp';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.scss';

type DebuggerWindowContentProps = Pick<
  DebuggerWindowProps,
  'worldTimeMs' | 'onHoverDetail' | 'onLeaveDetail'
>;

export function DebuggerWindowContent({
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: DebuggerWindowContentProps) {
  return (
    <div className={styles.panel} aria-label="Debugger">
      <strong className={styles.time}>
        <CalendarTimestamp
          timestampMs={worldTimeMs}
          display="full"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </strong>
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
