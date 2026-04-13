import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import labelStyles from '../windowLabels.module.css';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.css';

const DebuggerWindowContent = lazy(() =>
  import('./DebuggerWindowContent').then((module) => ({
    default: module.DebuggerWindowContent,
  })),
);

export const DebuggerWindow = memo(function DebuggerWindow({
  position,
  onMove,
  visible,
  onClose,
  timeLabel,
  onTriggerEarthshake,
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
    >
      <Suspense fallback={<WindowLoadingState />}>
        <DebuggerWindowContent
          timeLabel={timeLabel}
          onTriggerEarthshake={onTriggerEarthshake}
        />
      </Suspense>
    </DraggableWindow>
  );
});
