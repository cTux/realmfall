import { t } from '../../../i18n';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.scss';

type LootWindowContentProps = Pick<
  LootWindowProps,
  'loot' | 'equipment' | 'onTakeItem' | 'onHoverItem' | 'onLeaveItem'
>;

export function LootWindowContent({
  loot,
  equipment,
  onTakeItem,
  onHoverItem,
  onLeaveItem,
}: LootWindowContentProps) {
  return (
    <div className={styles.grid}>
      {loot.map((item) => (
        <ItemSlotButton
          key={item.id}
          item={item}
          onClick={() => onTakeItem(item.id)}
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
      {loot.length === 0 ? (
        <div className={styles.empty}>{t('ui.common.empty')}</div>
      ) : null}
    </div>
  );
}
