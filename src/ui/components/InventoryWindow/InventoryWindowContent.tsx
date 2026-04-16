import { isRecipePage } from '../../../game/state';
import { t } from '../../../i18n';
import { Icons } from '../../icons';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.scss';

type InventoryWindowContentProps = Pick<
  InventoryWindowProps,
  | 'inventory'
  | 'equipment'
  | 'learnedRecipeIds'
  | 'onEquip'
  | 'onContextItem'
  | 'onHoverItem'
  | 'onLeaveItem'
>;

export function InventoryWindowContent({
  inventory,
  equipment,
  learnedRecipeIds,
  onEquip,
  onContextItem,
  onHoverItem,
  onLeaveItem,
}: InventoryWindowContentProps) {
  return (
    <div className={styles.grid}>
      {inventory.map((item) => (
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
          borderColorOverride={
            isRecipePage(item) &&
            item.recipeId &&
            !learnedRecipeIds.includes(item.recipeId)
              ? '#22c55e'
              : undefined
          }
          overlayColorOverride={
            isRecipePage(item) &&
            item.recipeId &&
            !learnedRecipeIds.includes(item.recipeId)
              ? 'rgba(96, 165, 250, 0.28)'
              : undefined
          }
          onClick={() => onEquip(item.id)}
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
      ))}
      {inventory.length === 0 ? (
        <div className={styles.empty}>{t('ui.common.empty')}</div>
      ) : null}
    </div>
  );
}
