import { ItemSlot as ItemSlotButton } from '@realmfall/ui';
import { canSellItem } from '../../../game/inventory';
import { isRecipePage } from '../../../game/stateSelectors';
import { t } from '../../../i18n';
import { Icons } from '../../icons';
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
  return (
    <div className={styles.grid}>
      {inventory.map((item) => {
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
      ) : null}
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
