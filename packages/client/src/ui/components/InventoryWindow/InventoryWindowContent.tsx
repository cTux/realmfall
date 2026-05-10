import { useMemo, useState } from 'react';
import { Button, ItemSlot as ItemSlotButton } from '@realmfall/ui-react';
import { canSellItem } from '@realmfall/core/game/inventory';
import { t } from '../../../i18n';
import { iconForItem, Icons } from '../../icons';
import { iconMaskStyle } from '../../iconMaskStyle';
import type { InventoryWindowProps } from './types';
import {
  ALL_INVENTORY_ITEM_FILTER_IDS,
  getInventoryItemFilterId,
  INVENTORY_ITEM_FILTERS,
  type InventoryItemFilterId,
} from './inventoryItemFilters';
import styles from './styles.module.scss';

type InventoryWindowContentProps = Pick<
  InventoryWindowProps,
  | 'inventory'
  | 'equipment'
  | 'hexItemModificationPickerActive'
  | 'learnedRecipeIds'
  | 'onActivateItem'
  | 'onSellItem'
  | 'onContextItem'
  | 'onSelectHexItemModificationItem'
  | 'inTownForQuickSell'
  | 'onHoverItem'
  | 'onLeaveItem'
>;

export function InventoryWindowContent({
  inventory,
  equipment,
  hexItemModificationPickerActive = false,
  onActivateItem,
  onSellItem,
  onContextItem,
  onSelectHexItemModificationItem,
  inTownForQuickSell = false,
  onHoverItem,
  onLeaveItem,
}: InventoryWindowContentProps) {
  const [enabledFilters, setEnabledFilters] = useState<
    Set<InventoryItemFilterId>
  >(() => new Set(ALL_INVENTORY_ITEM_FILTER_IDS));
  const visibleInventory = useMemo(
    () =>
      inventory.filter((item) =>
        enabledFilters.has(getInventoryItemFilterId(item)),
      ),
    [enabledFilters, inventory],
  );

  const toggleFilter = (filterId: InventoryItemFilterId) => {
    setEnabledFilters((current) => {
      const next = new Set(current);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  return (
    <div className={styles.content}>
      <div className={styles.filterBar}>
        <div className={styles.slotFilterControls}>
          <Button
            unstyled
            type="button"
            size="small"
            className={styles.slotFilterControlButton}
            onClick={() =>
              setEnabledFilters(new Set(ALL_INVENTORY_ITEM_FILTER_IDS))
            }
          >
            {t('ui.common.allAction')}
          </Button>
          <Button
            unstyled
            type="button"
            size="small"
            className={styles.slotFilterControlButton}
            onClick={() => setEnabledFilters(new Set())}
          >
            {t('ui.common.noneAction')}
          </Button>
        </div>
        {INVENTORY_ITEM_FILTERS.map((filter) => {
          const isFilterEnabled = enabledFilters.has(filter.id);
          const label = t(filter.labelKey);
          return (
            <Button
              key={filter.id}
              unstyled
              type="button"
              size="small"
              data-filter-button="true"
              aria-label={label}
              aria-pressed={isFilterEnabled}
              className={styles.filterIconButton}
              onClick={() => toggleFilter(filter.id)}
              style={{ opacity: isFilterEnabled ? 1 : 0.5 }}
            >
              <span
                className={styles.filterIcon}
                style={iconMaskStyle(iconForItem(filter.previewItem))}
                data-filter-icon="true"
                aria-hidden="true"
              />
            </Button>
          );
        })}
      </div>
      <div className={styles.grid}>
        {visibleInventory.map((item) => {
          return (
            <ItemSlotButton
              key={item.id}
              item={item}
              size="compact"
              cornerIcon={
                item.locked
                  ? {
                      icon: Icons.Padlock,
                      color: '#ef4444',
                      label: t('ui.inventory.lockedLabel'),
                    }
                  : undefined
              }
              onClick={(event) => {
                if (hexItemModificationPickerActive) {
                  onSelectHexItemModificationItem?.(item);
                  return;
                }

                if (
                  event.shiftKey &&
                  inTownForQuickSell &&
                  !item.locked &&
                  canSellItem(item)
                ) {
                  onSellItem(item.id);
                  onLeaveItem();
                  return;
                }

                onActivateItem(item.id);
              }}
              onContextMenu={(event) => onContextItem(event, item)}
              onMouseEnter={(event) =>
                onHoverItem(
                  event,
                  item,
                  item.slot ? equipment[item.slot] : undefined,
                )
              }
              onMouseLeave={onLeaveItem}
            />
          );
        })}
        {inventory.length === 0 ? (
          <div className={styles.empty}>{t('ui.common.empty')}</div>
        ) : visibleInventory.length === 0 ? (
          <div className={styles.empty}>{t('ui.inventory.emptyFilter')}</div>
        ) : null}
      </div>
    </div>
  );
}
