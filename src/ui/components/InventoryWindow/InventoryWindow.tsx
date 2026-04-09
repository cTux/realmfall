import { memo } from 'react';
import { iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import { DraggableWindow } from '../DraggableWindow';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.css';

export const InventoryWindow = memo(function InventoryWindow({
  position,
  onMove,
  inventory,
  equipment,
  canProspect,
  canSell,
  onSort,
  onProspect,
  onSellAll,
  onEquip,
  onContextItem,
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
        <div className={styles.actions}>
          <button onClick={onSort}>Sort</button>
          <button onClick={onProspect} disabled={!canProspect}>
            Prospect
          </button>
          <button onClick={onSellAll} disabled={!canSell}>
            Sell all equippable
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {inventory.map((item) => (
          <button
            key={item.id}
            className={styles.itemCard}
            style={{
              borderColor: rarityColor(item.rarity),
              boxShadow: `0 0 0 1px ${rarityColor(item.rarity)}33 inset`,
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
              style={iconMaskStyle(iconForItem(item), rarityColor(item.rarity))}
              aria-label={item.kind}
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
});

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
