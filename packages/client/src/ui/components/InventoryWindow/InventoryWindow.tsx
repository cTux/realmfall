import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.scss';

type InventoryWindowContentProps = Parameters<
  (typeof import('./InventoryWindowContent'))['InventoryWindowContent']
>[0];

export const InventoryWindow = createDeferredWindowComponent<
  InventoryWindowProps,
  InventoryWindowContentProps
>({
  displayName: 'InventoryWindow',
  loadContent: () =>
    import('./InventoryWindowContent').then((module) => ({
      default: module.InventoryWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    onSort,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.inventory.plain,
    hotkeyLabel: WINDOW_LABELS.inventory,
    position,
    onMove,
    className: styles.window,
    visible,
    externalUnmount: true,
    onClose,
    resizeBounds: { minWidth: 320, minHeight: 220 },
    onHoverDetail,
    onLeaveDetail,
    headerActions: (
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
    ),
  }),
  mapContentProps: ({
    inventory,
    equipment,
    hexItemModificationPickerActive,
    learnedRecipeIds,
    onActivateItem,
    onSellItem,
    onContextItem,
    onSelectHexItemModificationItem,
    inTownForQuickSell,
    onHoverItem,
    onLeaveItem,
  }) => ({
    inventory,
    equipment,
    hexItemModificationPickerActive,
    learnedRecipeIds,
    onActivateItem,
    onSellItem,
    onContextItem,
    onSelectHexItemModificationItem,
    inTownForQuickSell,
    onHoverItem,
    onLeaveItem,
  }),
});
