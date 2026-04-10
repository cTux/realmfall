import { memo } from 'react';
import { formatCompactNumber } from '../../formatters';
import { iconForItem, itemTint } from '../../icons';
import { DraggableWindow } from '../DraggableWindow';
import type { LootWindowProps } from './types';
import styles from '../InventoryWindow/styles.module.css';

export const LootWindow = memo(function LootWindow({
  position,
  onMove,
  collapsed,
  onCollapsedChange,
  visible,
  loot,
  equipment,
  onTakeAll,
  onTakeItem,
  onHoverItem,
  onLeaveItem,
}: LootWindowProps) {
  return (
    <DraggableWindow
      title="Loot on the Ground"
      position={position}
      onMove={onMove}
      className={styles.window}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      visible={visible}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <button
              className={styles.headerButton}
              onClick={onTakeAll}
              disabled={loot.length === 0}
            >
              Take all
            </button>
          </div>
        </div>
      }
    >
      <div className={styles.grid}>
        {loot.map((item) => (
          <button
            key={item.id}
            className={styles.itemCard}
            style={{
              borderColor: itemTint(item),
              boxShadow: `0 0 0 1px ${itemTint(item)}33 inset`,
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
