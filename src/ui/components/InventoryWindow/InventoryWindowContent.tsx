import { formatCompactNumber } from '../../formatters';
import { iconForItem, itemTint } from '../../icons';
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
        <button
          key={item.id}
          className={styles.itemCard}
          style={{
            borderColor: itemTint(item),
            boxShadow: `0 0 0 1px ${itemTint(item)}33 inset`,
          }}
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
        >
          <span
            className={styles.itemIcon}
            style={iconMaskStyle(iconForItem(item), itemTint(item))}
            aria-label={item.kind}
          />
          {item.quantity > 1 ? (
            <span className={styles.stackBadge}>
              x{formatCompactNumber(item.quantity)}
            </span>
          ) : null}
        </button>
      ))}
      {inventory.length === 0 ? (
        <div className={styles.empty}>Empty</div>
      ) : null}
    </div>
  );
}

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
