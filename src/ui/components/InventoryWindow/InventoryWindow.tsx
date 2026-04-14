import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import labelStyles from '../windowLabels.module.scss';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.scss';

const InventoryWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./InventoryWindowContent').then((module) => ({
      default: module.InventoryWindowContent,
    })),
  ),
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
      title={
        <WindowLabel
          label={WINDOW_LABELS.inventory}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      resizeBounds={{ minWidth: 320, minHeight: 220 }}
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
