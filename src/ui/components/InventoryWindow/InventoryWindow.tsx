import { lazy, memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
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
  learnedRecipeIds,
  onSort,
  onEquip,
  onContextItem,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: InventoryWindowProps) {
  return (
    <WindowShell
      title={WINDOW_LABELS.inventory.plain}
      hotkeyLabel={WINDOW_LABELS.inventory}
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
              onClick={onSort}
              tooltipTitle={t('ui.inventory.sortAction')}
              tooltipLines={[
                {
                  kind: 'text',
                  text: t('ui.tooltip.window.sortInventory'),
                },
              ]}
              tooltipBorderColor="rgba(74, 222, 128, 0.9)"
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.inventory.sortAction')}
            </WindowHeaderActionButton>
          </div>
        </div>
      }
    >
      <Suspense fallback={<WindowLoadingState />}>
        <InventoryWindowContent
          inventory={inventory}
          equipment={equipment}
          learnedRecipeIds={learnedRecipeIds}
          onEquip={onEquip}
          onContextItem={onContextItem}
          onHoverItem={onHoverItem}
          onLeaveItem={onLeaveItem}
        />
      </Suspense>
    </WindowShell>
  );
});
