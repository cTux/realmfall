import { memo, Suspense } from 'react';
import { useWorldClockTime } from '../../../app/App/worldClockStore';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.scss';

const DebuggerWindowContent = createLazyWindowComponent<
  Parameters<(typeof import('./DebuggerWindowContent'))['DebuggerWindowContent']>[0]
>(() =>
  import('./DebuggerWindowContent').then((module) => ({
    default: module.DebuggerWindowContent,
  })),
);

export const DebuggerWindow = memo(function DebuggerWindow({
  position,
  onMove,
  visible,
  onClose,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: DebuggerWindowProps) {
  const liveWorldTimeMs = useWorldClockTime();
  const resolvedWorldTimeMs = liveWorldTimeMs || worldTimeMs || 0;

  return (
    <WindowShell
      title={WINDOW_LABELS.worldTime.plain}
      hotkeyLabel={WINDOW_LABELS.worldTime}
      position={position}
      onMove={onMove}
      visible={visible}
      onClose={onClose}
      className={styles.window}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <DebuggerWindowContent
          worldTimeMs={resolvedWorldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
