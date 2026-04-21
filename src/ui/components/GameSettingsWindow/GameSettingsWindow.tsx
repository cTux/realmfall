import { memo } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { createLazyWindowComponent } from '../lazyWindowComponent';
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
      <DeferredWindowShell
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
        content={GameSettingsWindowContent}
        contentProps={{
          audioSettings,
          graphicsSettings,
          onClose,
          onResetSaveData,
          onSave,
          onSaveAndReload,
        }}
      />
    </>
  );
});
