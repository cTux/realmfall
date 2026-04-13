import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.scss';

const LootWindowContent = lazy(() =>
  import('./LootWindowContent').then((module) => ({
    default: module.LootWindowContent,
  })),
);

export const LootWindow = memo(function LootWindow({
  position,
  onMove,
  visible,
  loot,
  equipment,
  onClose,
  onTakeAll,
  onTakeItem,
  onHoverItem,
  onLeaveItem,
}: LootWindowProps) {
  return (
    <DraggableWindow
      title="Loot on the Ground"
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <button
              className={styles.headerButton}
              onClick={onTakeAll}
              disabled={loot.length === 0}
            >
              Tak(e) all
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={<WindowLoadingState />}>
        <LootWindowContent
          loot={loot}
          equipment={equipment}
          onTakeItem={onTakeItem}
          onHoverItem={onHoverItem}
          onLeaveItem={onLeaveItem}
        />
      </Suspense>
    </DraggableWindow>
  );
});
