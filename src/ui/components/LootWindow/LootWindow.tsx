import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
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
    <WindowShell
      title={t('ui.loot.title')}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      resizeBounds={{ minWidth: 320, minHeight: 220 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <WindowHeaderActionButton
              className={styles.headerButton}
              disabled={loot.length === 0}
              onClick={onTakeAll}
              tooltipTitle={t('ui.loot.takeAllAction')}
              tooltipLines={[
                { kind: 'text', text: t('ui.tooltip.window.takeAllLoot') },
              ]}
              tooltipBorderColor="rgba(74, 222, 128, 0.9)"
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.loot.takeAllAction')}
            </WindowHeaderActionButton>
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
    </WindowShell>
  );
});
