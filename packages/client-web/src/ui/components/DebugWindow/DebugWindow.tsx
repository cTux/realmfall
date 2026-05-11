import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import type { DebugWindowProps } from './types';
import styles from './styles.module.scss';

type DebugWindowContentProps = Parameters<
  (typeof import('./DebugWindowContent'))['DebugWindowContent']
>[0];

export const DebugWindow = createDeferredWindowComponent<
  DebugWindowProps,
  DebugWindowContentProps
>({
  displayName: 'DebugWindow',
  loadContent: () =>
    import('./DebugWindowContent').then((module) => ({
      default: module.DebugWindowContent,
    })),
  mapWindowProps: ({ onClose, onMove, position, visible }) => ({
    title: WINDOW_LABELS.debug.plain,
    hotkeyLabel: WINDOW_LABELS.debug,
    position,
    onMove,
    visible,
    externalUnmount: true,
    onClose,
    className: styles.window,
    bodyClassName: styles.windowBody,
    resizeBounds: { minWidth: 620, minHeight: 460 },
  }),
  mapContentProps: ({
    onCreateEquipmentItem,
    onCreateDropItem,
    onSpawnEnemyNearby,
    onTriggerBloodMoon,
    onTriggerHarvestMoon,
    onTriggerEarthquake,
    onSetMorning,
    onSetNight,
  }) => ({
    onCreateEquipmentItem,
    onCreateDropItem,
    onSpawnEnemyNearby,
    onTriggerBloodMoon,
    onTriggerHarvestMoon,
    onTriggerEarthquake,
    onSetMorning,
    onSetNight,
  }),
});
