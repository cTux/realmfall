import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import labelStyles from '../windowLabels.module.scss';
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
    <DraggableWindow
      title={
        <WindowLabel
          label={WINDOW_LABELS.worldTime}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
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
    </DraggableWindow>
  );
});
