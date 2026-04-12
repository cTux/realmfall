import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.css';

const InventoryWindowContent = lazy(() =>
  import('./InventoryWindowContent').then((module) => ({
    default: module.InventoryWindowContent,
  })),
);

export const InventoryWindow = memo(function InventoryWindow({
  position,
  onMove,
  visible,
  onClose,
  inventory,
  equipment,
  onSort,
  onEquip,
  onContextItem,
  onHoverItem,
  onLeaveItem,
}: InventoryWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(WINDOW_LABELS.inventory, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <button className={styles.headerButton} onClick={onSort}>
              Sort
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={<WindowLoadingState />}>
        <InventoryWindowContent
          inventory={inventory}
          equipment={equipment}
          onEquip={onEquip}
          onContextItem={onContextItem}
          onHoverItem={onHoverItem}
          onLeaveItem={onLeaveItem}
        />
      </Suspense>
    </DraggableWindow>
  );
});
