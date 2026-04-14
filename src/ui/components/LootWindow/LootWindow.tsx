import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.scss';

const LootWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./LootWindowContent').then((module) => ({
      default: module.LootWindowContent,
    })),
  ),
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
  onHoverDetail,
  onLeaveDetail,
}: LootWindowProps) {
  return (
    <DraggableWindow
      title={t('ui.loot.title')}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <button
              className={styles.headerButton}
              onClick={onTakeAll}
              disabled={loot.length === 0}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  t('ui.loot.takeAllAction'),
                  [{ kind: 'text', text: t('ui.tooltip.window.takeAllLoot') }],
                  'rgba(74, 222, 128, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              {t('ui.loot.takeAllAction')}
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
