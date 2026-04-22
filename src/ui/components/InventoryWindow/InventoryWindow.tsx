import { memo } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.scss';

const InventoryWindowContent = createLazyWindowComponent<
  Parameters<
    (typeof import('./InventoryWindowContent'))['InventoryWindowContent']
  >[0]
>(() =>
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
  hexItemModificationPickerActive,
  learnedRecipeIds,
  onSort,
  onActivateItem,
  onContextItem,
  onSelectHexItemModificationItem,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: InventoryWindowProps) {
  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.inventory.plain}
      hotkeyLabel={WINDOW_LABELS.inventory}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
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
      content={InventoryWindowContent}
      contentProps={{
        inventory,
        equipment,
        hexItemModificationPickerActive,
        learnedRecipeIds,
        onActivateItem,
        onContextItem,
        onSelectHexItemModificationItem,
        onHoverItem,
        onLeaveItem,
      }}
    />
  );
});
