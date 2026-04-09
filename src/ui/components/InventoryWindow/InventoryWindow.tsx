import { iconForItem } from '../../icons';
import { DraggableWindow } from '../DraggableWindow';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.css';

export function InventoryWindow({
  position,
  onMove,
  gold,
  inventory,
  equipment,
  onSort,
  onProspect,
  onSellAll,
  onEquip,
  onHoverItem,
  onLeaveItem,
}: InventoryWindowProps) {
  return (
    <DraggableWindow
      title="Inventory"
      position={position}
      onMove={onMove}
      className={styles.window}
    >
      <div className={styles.toolbar}>
        <div className={styles.goldLine}>Gold: {gold}</div>
        <div className={styles.actions}>
          <button onClick={onSort}>Sort</button>
          <button onClick={onProspect}>Prospect</button>
          <button onClick={onSellAll}>Sell all</button>
        </div>
      </div>
      <div className={styles.grid}>
        {inventory.map((item) => (
          <button
            key={item.id}
            className={styles.itemCard}
            onClick={() => onEquip(item.id)}
            onMouseEnter={(event) =>
              onHoverItem(
                event,
                item,
                item.slot ? equipment[item.slot] : undefined,
              )
            }
            onMouseLeave={onLeaveItem}
          >
            <img
              className={styles.itemIcon}
              src={iconForItem(item)}
              alt={item.kind}
            />
            {item.quantity > 1 ? (
              <span className={styles.stackBadge}>x{item.quantity}</span>
            ) : null}
          </button>
        ))}
        {inventory.length === 0 ? (
          <div className={styles.empty}>Empty</div>
        ) : null}
      </div>
    </DraggableWindow>
  );
}
