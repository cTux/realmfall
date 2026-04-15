import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowLoadingState } from '../WindowLoadingState';
import { WindowShell } from '../WindowShell';
import type { GameSettingsWindowProps } from './types';
import styles from './styles.module.scss';

const GameSettingsWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./GameSettingsWindowContent').then((module) => ({
      default: module.GameSettingsWindowContent,
    })),
  ),
);

export const GameSettingsWindow = memo(function GameSettingsWindow({
  graphicsSettings,
  onClose,
  onMove,
  onResetSaveData,
  onSave,
  onSaveAndReload,
  position,
  visible,
}: GameSettingsWindowProps) {
  return (
    <>
      {visible ? <div className={styles.overlay} aria-hidden="true" /> : null}
      <WindowShell
        title={WINDOW_LABELS.settings.plain}
        hotkeyLabel={WINDOW_LABELS.settings}
        position={position}
        onMove={onMove}
        visible={visible}
        onClose={onClose}
        className={styles.window}
        resizeBounds={{ minWidth: 520, minHeight: 520 }}
      >
        <Suspense fallback={<WindowLoadingState />}>
          <GameSettingsWindowContent
            graphicsSettings={graphicsSettings}
            onClose={onClose}
            onResetSaveData={onResetSaveData}
            onSave={onSave}
            onSaveAndReload={onSaveAndReload}
          />
        </Suspense>
      </WindowShell>
    </>
  );
});
