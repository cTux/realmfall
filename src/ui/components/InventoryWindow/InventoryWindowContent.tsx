import { t } from '../../../i18n';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.scss';

type InventoryWindowContentProps = Pick<
  InventoryWindowProps,
  | 'inventory'
  | 'equipment'
  | 'onEquip'
  | 'onContextItem'
  | 'onHoverItem'
  | 'onLeaveItem'
>;

export function InventoryWindowContent({
  inventory,
  equipment,
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
