import type { ComponentType } from 'react';
import FPSStatsModule from 'react-fps-stats';
import { CalendarTimestamp } from '../CalendarTimestamp';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.scss';

type FPSStatsProps = {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  graphHeight?: string | number;
  graphWidth?: string | number;
};

function resolveFPSStatsComponent() {
  if (typeof FPSStatsModule === 'function') {
    return FPSStatsModule as ComponentType<FPSStatsProps>;
  }

  const nestedDefault = (FPSStatsModule as { default?: unknown }).default;

  if (typeof nestedDefault === 'function') {
    return nestedDefault as ComponentType<FPSStatsProps>;
  }

  return null;
}

const FPSStats = resolveFPSStatsComponent();

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
      {FPSStats ? (
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
      ) : null}
    </div>
  );
}
