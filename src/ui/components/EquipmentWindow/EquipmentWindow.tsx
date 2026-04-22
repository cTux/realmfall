import { memo } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.scss';

const EquipmentWindowContent = createLazyWindowComponent<
  Parameters<
    (typeof import('./EquipmentWindowContent'))['EquipmentWindowContent']
  >[0]
>(() =>
  import('./EquipmentWindowContent').then((module) => ({
    default: module.EquipmentWindowContent,
  })),
);

export const EquipmentWindow = memo(function EquipmentWindow({
  position,
  onMove,
  visible,
  onClose,
  equipment,
  hexItemModificationPickerActive,
  onHoverItem,
  onLeaveItem,
  onUnequip,
  onContextItem,
  onSelectHexItemModificationItem,
  onHoverDetail,
  onLeaveDetail,
}: EquipmentWindowProps) {
  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.equipment.plain}
      hotkeyLabel={WINDOW_LABELS.equipment}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      content={EquipmentWindowContent}
      contentProps={{
        equipment,
        hexItemModificationPickerActive,
        onHoverItem,
        onLeaveItem,
        onUnequip,
        onContextItem,
        onSelectHexItemModificationItem,
        onHoverDetail,
        onLeaveDetail,
      }}
    />
  );
});
