import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { formatCompactNumber } from '../../formatters';
import { formatEquipmentSlotLabel, formatItemLabel } from '../../../i18n/labels';
import { t } from '../../../i18n';
import type { EquipmentSlot, Item } from '../../../game/state';
import { iconForItem, itemTint } from '../../icons';
import styles from './styles.module.scss';

interface ItemSlotCornerIcon {
  icon: string;
  color: string;
  label?: string;
}

interface ItemSlotButtonProps {
  item?: Item;
  slot?: EquipmentSlot;
  size?: 'default' | 'compact';
  className?: string;
  style?: CSSProperties;
  tintOverride?: string;
  cornerIcon?: ItemSlotCornerIcon;
  hidePlaceholderIconWhenEmpty?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onContextMenu?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onEmptyMouseEnter?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: () => void;
}

export function ItemSlotButton({
  item,
  slot,
  size = 'default',
  className,
  style,
  tintOverride,
  cornerIcon,
  hidePlaceholderIconWhenEmpty = false,
  disabled = false,
  onClick,
  onContextMenu,
  onMouseEnter,
  onEmptyMouseEnter,
  onMouseLeave,
}: ItemSlotButtonProps) {
  const tint =
    tintOverride ?? (item ? itemTint(item) : 'rgba(148, 163, 184, 0.32)');
  const isInteractive = Boolean(
    !disabled && item && (onClick || onContextMenu || onMouseEnter),
  );
  const showIcon = item || !hidePlaceholderIconWhenEmpty;

  return (
    <button
      type="button"
      className={[
        styles.slot,
        isInteractive ? styles.interactive : '',
        item ? '' : styles.empty,
        disabled ? styles.disabled : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        borderColor: tint,
        boxShadow: item ? `0 0 0 1px ${tint}33 inset` : undefined,
      }}
      data-size={size}
      onClick={item && !disabled ? onClick : undefined}
      onContextMenu={item && !disabled ? onContextMenu : undefined}
      onMouseEnter={
        disabled ? undefined : item ? onMouseEnter : onEmptyMouseEnter
      }
      onMouseLeave={item || onEmptyMouseEnter ? onMouseLeave : undefined}
      disabled={disabled}
      aria-label={item ? undefined : getEmptySlotLabel(slot)}
    >
      {showIcon ? (
        <span
          className={styles.icon}
          style={iconMaskStyle(iconForItem(item, slot), tint)}
          aria-label={item ? formatItemLabel(item) : undefined}
        />
      ) : null}
      {item && item.quantity > 1 ? (
        <span className={styles.stackBadge}>
          x{formatCompactNumber(item.quantity)}
        </span>
      ) : null}
      {cornerIcon ? (
        <span
          className={styles.cornerIcon}
          style={iconMaskStyle(cornerIcon.icon, cornerIcon.color)}
          aria-label={cornerIcon.label}
        />
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
