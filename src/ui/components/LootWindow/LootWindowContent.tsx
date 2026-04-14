import { formatCompactNumber } from '../../formatters';
import { formatItemLabel } from '../../../i18n/labels';
import { t } from '../../../i18n';
import { iconForItem, itemTint } from '../../icons';
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
            aria-label={formatItemLabel(item)}
          />
          {item.quantity > 1 ? (
            <span className={styles.stackBadge}>
              x{formatCompactNumber(item.quantity)}
            </span>
          ) : null}
        </button>
      ))}
      {loot.length === 0 ? (
        <div className={styles.empty}>{t('ui.common.empty')}</div>
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
