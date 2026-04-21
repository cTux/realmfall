import { memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowLoadingState } from '../WindowLoadingState';
import { WindowShell } from '../WindowShell';
import type { GameSettingsWindowProps } from './types';
import styles from './styles.module.scss';

const GameSettingsWindowContent = createLazyWindowComponent<
  Parameters<
    (typeof import('./GameSettingsWindowContent'))['GameSettingsWindowContent']
  >[0]
>(() =>
  import('./GameSettingsWindowContent').then((module) => ({
    default: module.GameSettingsWindowContent,
  })),
);

export const GameSettingsWindow = memo(function GameSettingsWindow({
  audioSettings,
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
        externalUnmount
        stackLayer="modal"
        onClose={onClose}
        className={styles.window}
        bodyClassName={styles.windowBody}
        resizeBounds={{ minWidth: 520, minHeight: 520 }}
      >
        <Suspense fallback={<WindowLoadingState />}>
          <GameSettingsWindowContent
            audioSettings={audioSettings}
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
