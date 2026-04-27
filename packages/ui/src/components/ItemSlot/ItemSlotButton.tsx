import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { formatCompactNumber } from '../../formatters';
import { formatEquipmentSlotLabel, formatItemLabel } from '../../i18n/labels';
import { t } from '../../i18n';
import type { EquipmentSlot, Item } from '../../game/stateTypes';
import { iconForItem, itemTint } from '../../icons';
import styles from './styles.module.scss';

interface ItemSlotCornerIcon {
  icon: string;
  color: string;
  label?: string;
}

export interface ItemSlotButtonProps {
  ariaLabel?: string;
  item?: Item;
  slot?: EquipmentSlot;
  size?: 'default' | 'compact';
  className?: string;
  style?: CSSProperties;
  tintOverride?: string;
  borderColorOverride?: string;
  overlayColorOverride?: string;
  cornerIcon?: ItemSlotCornerIcon;
  badgeLabel?: string;
  badgeIcon?: string;
  badgeIconLabel?: string;
  hidePlaceholderIconWhenEmpty?: boolean;
  disabled?: boolean;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onContextMenu?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onEmptyMouseEnter?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: () => void;
}

export function ItemSlotButton({
  ariaLabel,
  item,
  slot,
  size = 'default',
  className,
  style,
  tintOverride,
  borderColorOverride,
  overlayColorOverride,
  cornerIcon,
  badgeLabel,
  badgeIcon,
  badgeIconLabel,
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
  const borderColor = borderColorOverride ?? tint;
  const isInteractive = Boolean(
    !disabled &&
    (onClick || onContextMenu || onMouseEnter || onEmptyMouseEnter),
  );
  const showIcon = item || !hidePlaceholderIconWhenEmpty;
  const resolvedBadgeLabel =
    badgeLabel ??
    (item && item.quantity > 1
      ? `x${formatCompactNumber(item.quantity)}`
      : null);

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
        borderColor,
        boxShadow: item ? `0 0 0 1px ${borderColor}33 inset` : undefined,
      }}
      data-size={size}
      onClick={!disabled ? (event) => onClick?.(event) : undefined}
      onContextMenu={!disabled ? onContextMenu : undefined}
      onMouseEnter={
        disabled ? undefined : item ? onMouseEnter : onEmptyMouseEnter
      }
      onMouseLeave={item || onEmptyMouseEnter ? onMouseLeave : undefined}
      disabled={disabled}
      aria-label={ariaLabel ?? (item ? undefined : getEmptySlotLabel(slot))}
    >
      {overlayColorOverride ? (
        <span
          className={styles.overlay}
          style={{ backgroundColor: overlayColorOverride }}
          aria-hidden="true"
        />
      ) : null}
      {showIcon ? (
        <span
          className={styles.icon}
          style={iconMaskStyle(iconForItem(item, slot), tint)}
          aria-label={item ? formatItemLabel(item) : undefined}
        />
      ) : null}
      {resolvedBadgeLabel ? (
        <span className={styles.stackBadge}>
          {badgeIcon ? (
            <span
              className={styles.stackBadgeIcon}
              style={iconMaskStyle(badgeIcon, 'currentcolor')}
              aria-label={badgeIconLabel}
            />
          ) : null}
          <span>{resolvedBadgeLabel}</span>
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
