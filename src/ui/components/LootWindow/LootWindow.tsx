import { memo } from 'react';
import { iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import { DraggableWindow } from '../DraggableWindow';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.css';

export const LootWindow = memo(function LootWindow({
  position,
  onMove,
  loot,
  equipment,
  onClose,
  onTakeAll,
  onTakeItem,
  onHoverItem,
  onLeaveItem,
}: LootWindowProps) {
  return (
    <DraggableWindow
      title="Loot"
      position={position}
      onMove={onMove}
      className={styles.window}
    >
      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <button onClick={onClose}>Close</button>
          <button onClick={onTakeAll} disabled={loot.length === 0}>
            Take all
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {loot.map((item) => (
          <button
            key={item.id}
            className={styles.itemCard}
            style={{
              borderColor: itemColor(item),
              boxShadow: `0 0 0 1px ${itemColor(item)}33 inset`,
            }}
            onClick={() => onTakeItem(item.id)}
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
              style={iconMaskStyle(iconForItem(item), itemColor(item))}
              aria-label={item.kind}
            />
            {item.quantity > 1 ? (
              <span className={styles.stackBadge}>x{item.quantity}</span>
            ) : null}
          </button>
        ))}
        {loot.length === 0 ? <div className={styles.empty}>Empty</div> : null}
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

function itemColor(item: LootWindowProps['loot'][number]) {
  return item.kind === 'resource' && item.name === 'Gold'
    ? '#fbbf24'
    : rarityColor(item.rarity);
}
