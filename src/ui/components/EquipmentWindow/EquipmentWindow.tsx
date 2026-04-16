import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.scss';

const EquipmentWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./EquipmentWindowContent').then((module) => ({
      default: module.EquipmentWindowContent,
    })),
  ),
);

export const EquipmentWindow = memo(function EquipmentWindow({
  position,
  onMove,
  visible,
  onClose,
  equipment,
  onHoverItem,
  onLeaveItem,
  onUnequip,
  onContextItem,
  onHoverDetail,
  onLeaveDetail,
}: EquipmentWindowProps) {
  return (
    <WindowShell
      title={WINDOW_LABELS.equipment.plain}
      hotkeyLabel={WINDOW_LABELS.equipment}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <EquipmentWindowContent
          equipment={equipment}
          onHoverItem={onHoverItem}
          onLeaveItem={onLeaveItem}
          onUnequip={onUnequip}
          onContextItem={onContextItem}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
