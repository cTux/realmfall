import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.scss';

type EquipmentWindowContentProps = Parameters<
  (typeof import('./EquipmentWindowContent'))['EquipmentWindowContent']
>[0];

export const EquipmentWindow = createDeferredWindowComponent<
  EquipmentWindowProps,
  EquipmentWindowContentProps
>({
  displayName: 'EquipmentWindow',
  loadContent: () =>
    import('./EquipmentWindowContent').then((module) => ({
      default: module.EquipmentWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.equipment.plain,
    hotkeyLabel: WINDOW_LABELS.equipment,
    position,
    onMove,
    className: styles.window,
    visible,
    externalUnmount: true,
    onClose,
    onHoverDetail,
    onLeaveDetail,
  }),
  mapContentProps: ({
    equipment,
    hexItemModificationPickerActive,
    onHoverItem,
    onLeaveItem,
    onUnequip,
    onContextItem,
    onSelectHexItemModificationItem,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    equipment,
    hexItemModificationPickerActive,
    onHoverItem,
    onLeaveItem,
    onUnequip,
    onContextItem,
    onSelectHexItemModificationItem,
    onHoverDetail,
    onLeaveDetail,
  }),
});
