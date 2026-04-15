import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.scss';

const DebuggerWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./DebuggerWindowContent').then((module) => ({
      default: module.DebuggerWindowContent,
    })),
  ),
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
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
