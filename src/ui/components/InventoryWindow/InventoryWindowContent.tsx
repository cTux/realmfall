import { useMemo, useState } from 'react';
import { canSellItem } from '../../../game/inventory';
import { getItemCategory } from '../../../game/content/items';
import { isRecipePage } from '../../../game/stateSelectors';
import { t } from '../../../i18n';
import type { Item } from '../../../game/types';
import { Icons } from '../../icons';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { InventoryWindowProps } from './types';
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
  | 'onHoverDetail'
  | 'onLeaveDetail'
>;

type InventoryItemFilter = 'equippable' | 'consumable' | 'resource';

type InventoryItemFilterConfig = {
  filter: InventoryItemFilter;
  icon: string;
  label: string;
  description: string;
};

const INVENTORY_ITEM_FILTERS: readonly InventoryItemFilterConfig[] = [
  {
    filter: 'equippable',
    icon: Icons.Weapon,
    label: 'Equippable',
    description: 'Shows equippable items, including armor and weapons.',
  },
  {
    filter: 'consumable',
    icon: Icons.Consumable,
    label: 'Consumables',
    description: 'Shows food, potions, and other consumables.',
  },
  {
    filter: 'resource',
    icon: Icons.StonePile,
    label: 'Materials',
    description: 'Shows resources and other crafting materials.',
  },
];

const ALL_INVENTORY_ITEM_FILTERS = new Set<InventoryItemFilter>(
  INVENTORY_ITEM_FILTERS.map(({ filter }) => filter),
);

const INVENTORY_FILTER_ICON_STYLE = {
  activeBorder: 'rgba(96, 165, 250, 0.58)',
  inactiveBorder: 'rgba(148, 163, 184, 0.14)',
  inactiveOverlay: 'rgba(2, 6, 23, 0.45)',
};

function makeInventoryFilterItem(icon: string, label: string): Item {
  return {
    id: `${label.toLowerCase()}-filter`,
    name: label,
    icon,
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
  };
}

function toInventoryItemFilterKind(
  category: ReturnType<typeof getItemCategory>,
): InventoryItemFilter {
  if (category === 'consumable') return 'consumable';
  if (category === 'resource') return 'resource';
  return 'equippable';
}

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
  onHoverDetail,
  onLeaveDetail,
}: InventoryWindowContentProps) {
  const [enabledFilters, setEnabledFilters] = useState<
    Set<InventoryItemFilter>
  >(() => new Set(ALL_INVENTORY_ITEM_FILTERS));
  const visibleInventory = useMemo(
    () =>
      inventory.filter((item) =>
        enabledFilters.has(toInventoryItemFilterKind(getItemCategory(item))),
      ),
    [enabledFilters, inventory],
  );

  const toggleFilter = (filter: InventoryItemFilter) => {
    setEnabledFilters((current) => {
      const next = new Set(current);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }

      return next;
    });
  };

  return (
    <div className={styles.layout}>
      <div className={styles.itemFilters}>
        <div className={styles.itemFilterControls}>
          <button
            type="button"
            className={styles.itemFilterControlButton}
            onClick={() => setEnabledFilters(new Set<InventoryItemFilter>())}
          >
            Disable All
          </button>
          <button
            type="button"
            className={styles.itemFilterControlButton}
            onClick={() =>
              setEnabledFilters(
                new Set<InventoryItemFilter>(ALL_INVENTORY_ITEM_FILTERS),
              )
            }
          >
            Enable All
          </button>
        </div>
        {INVENTORY_ITEM_FILTERS.map(({ filter, icon, label, description }) => {
          const isFilterEnabled = enabledFilters.has(filter);
          return (
            <ItemSlotButton
              key={filter}
              item={makeInventoryFilterItem(icon, label)}
              size="compact"
              ariaLabel={label}
              className={styles.itemFilterButton}
              tintOverride="#ffffff"
              onClick={() => toggleFilter(filter)}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  label,
                  [{ kind: 'text', text: description }],
                  'rgba(148, 163, 184, 0.9)',
                )
              }
              onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
              borderColorOverride={
                isFilterEnabled
                  ? INVENTORY_FILTER_ICON_STYLE.activeBorder
                  : INVENTORY_FILTER_ICON_STYLE.inactiveBorder
              }
              overlayColorOverride={
                isFilterEnabled
                  ? undefined
                  : INVENTORY_FILTER_ICON_STYLE.inactiveOverlay
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
        {visibleInventory.length === 0 ? (
          <div className={styles.empty}>{t('ui.common.empty')}</div>
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
