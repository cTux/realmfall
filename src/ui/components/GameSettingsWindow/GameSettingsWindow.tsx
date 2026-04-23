import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import type { GameSettingsWindowProps } from './types';
import styles from './styles.module.scss';

type GameSettingsWindowContentProps = Parameters<
  (typeof import('./GameSettingsWindowContent'))['GameSettingsWindowContent']
>[0];

export const GameSettingsWindow = createDeferredWindowComponent<
  GameSettingsWindowProps,
  GameSettingsWindowContentProps
>({
  displayName: 'GameSettingsWindow',
  loadContent: () =>
    import('./GameSettingsWindowContent').then((module) => ({
      default: module.GameSettingsWindowContent,
    })),
  mapWindowProps: ({ onClose, onMove, position, visible }) => ({
    title: WINDOW_LABELS.settings.plain,
    hotkeyLabel: WINDOW_LABELS.settings,
    position,
    onMove,
    visible,
    externalUnmount: true,
    stackLayer: 'modal',
    onClose,
    className: styles.window,
    bodyClassName: styles.windowBody,
    resizeBounds: { minWidth: 520, minHeight: 520 },
  }),
  mapContentProps: ({
    audioSettings,
    graphicsSettings,
    onClose,
    onResetSaveArea,
    onSave,
    onSaveAndReload,
  }) => ({
    audioSettings,
    graphicsSettings,
    onClose,
    onResetSaveArea,
    onSave,
    onSaveAndReload,
  }),
  wrapShell: (shell, { visible }) => (
    <>
      {visible ? <div className={styles.overlay} aria-hidden="true" /> : null}
      {shell}
    </>
  ),
});
