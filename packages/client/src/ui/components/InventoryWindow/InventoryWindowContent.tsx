import { useMemo, useState } from 'react';
import { Button, ItemSlot as ItemSlotButton } from '@realmfall/ui';
import { canSellItem } from '../../../game/inventory';
import { isRecipePage } from '../../../game/stateSelectors';
import { t } from '../../../i18n';
import { Icons } from '../../icons';
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
  learnedRecipeIds,
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
            className={styles.slotFilterControlButton}
            onClick={() =>
              setEnabledFilters(new Set(ALL_INVENTORY_ITEM_FILTER_IDS))
            }
          >
            {t('ui.inventory.filter.enableAllAction')}
          </Button>
          <Button
            unstyled
            type="button"
            className={styles.slotFilterControlButton}
            onClick={() => setEnabledFilters(new Set())}
          >
            {t('ui.inventory.filter.disableAllAction')}
          </Button>
        </div>
        {INVENTORY_ITEM_FILTERS.map((filter) => {
          const isFilterEnabled = enabledFilters.has(filter.id);
          const label = t(filter.labelKey);
          return (
            <ItemSlotButton
              key={filter.id}
              item={filter.previewItem}
              size="compact"
              ariaLabel={label}
              aria-pressed={isFilterEnabled}
              badgeLabel=""
              className={styles.slotFilterButton}
              tintOverride="#ffffff"
              onClick={() => toggleFilter(filter.id)}
              borderColorOverride={
                isFilterEnabled
                  ? 'rgba(96, 165, 250, 0.58)'
                  : 'rgba(148, 163, 184, 0.14)'
              }
              overlayColorOverride={
                isFilterEnabled ? undefined : 'rgba(2, 6, 23, 0.45)'
              }
              style={{ opacity: isFilterEnabled ? 1 : 0.5 }}
            />
          );
        })}
      </div>
      <div className={styles.grid}>
        {visibleInventory.map((item) => {
          const recipeState = getRecipeInventoryState(item, learnedRecipeIds);

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
              borderColorOverride={recipeState.borderColor}
              overlayColorOverride={recipeState.overlayColor}
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

function getRecipeInventoryState(
  item: InventoryWindowContentProps['inventory'][number],
  learnedRecipeIds: string[],
) {
  if (!isRecipePage(item) || !item.recipeId) {
    return {
      borderColor: undefined,
      overlayColor: undefined,
    };
  }

  if (learnedRecipeIds.includes(item.recipeId)) {
    return {
      borderColor: '#ef4444',
      overlayColor: undefined,
    };
  }

  return {
    borderColor: '#22c55e',
    overlayColor: 'rgba(96, 165, 250, 0.28)',
  };
}
