import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { formatCompactNumber } from '../../formatters';
import { formatEquipmentSlotLabel, formatItemLabel } from '../../../i18n/labels';
import { t } from '../../../i18n';
import type { EquipmentSlot, Item } from '../../../game/state';
import { iconForItem, itemTint } from '../../icons';
import styles from './styles.module.scss';

interface ItemSlotButtonProps {
  item?: Item;
  slot?: EquipmentSlot;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onContextMenu?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: () => void;
}

export function ItemSlotButton({
  item,
  slot,
  className,
  style,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: ItemSlotButtonProps) {
  const tint = item ? itemTint(item) : 'rgba(148, 163, 184, 0.32)';
  const isInteractive = Boolean(item && (onClick || onContextMenu || onMouseEnter));

  return (
    <button
      type="button"
      className={[
        styles.slot,
        isInteractive ? styles.interactive : '',
        item ? '' : styles.empty,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        borderColor: tint,
        boxShadow: item ? `0 0 0 1px ${tint}33 inset` : undefined,
      }}
      onClick={item ? onClick : undefined}
      onContextMenu={item ? onContextMenu : undefined}
      onMouseEnter={item ? onMouseEnter : undefined}
      onMouseLeave={item ? onMouseLeave : undefined}
      aria-label={item ? undefined : getEmptySlotLabel(slot)}
    >
      <span
        className={styles.icon}
        style={iconMaskStyle(iconForItem(item, slot), tint)}
        aria-label={item ? formatItemLabel(item) : undefined}
      />
      {item && item.quantity > 1 ? (
        <span className={styles.stackBadge}>
          x{formatCompactNumber(item.quantity)}
        </span>
      ) : null}
    </button>
  );
}

function getEmptySlotLabel(slot?: EquipmentSlot) {
  if (!slot) return t('ui.common.empty');
  return `${formatEquipmentSlotLabel(slot)} ${t('ui.common.empty').toLowerCase()}`;
}

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
