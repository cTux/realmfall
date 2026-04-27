import type { MouseEvent as ReactMouseEvent } from 'react';
import { t } from '../../i18n';
import type { Item } from '../../game/stateTypes';
import { ItemSlot } from '../ItemSlot';
import styles from './styles.module.scss';

export interface ActionBarSlotProps {
  slotIndex: number;
  item?: Item;
  depleted?: boolean;
  onClick: () => void;
  onClear: () => void;
  onHoverItem?: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onLeaveItem?: () => void;
}

export function ActionBarSlot({
  slotIndex,
  item,
  depleted = false,
  onClick,
  onClear,
  onHoverItem,
  onLeaveItem,
}: ActionBarSlotProps) {
  return (
    <div className={styles.slotWrap}>
      <ItemSlot
        ariaLabel={getActionBarSlotLabel(slotIndex, item)}
        className={styles.slot}
        item={item}
        size="compact"
        overlayColorOverride={depleted ? 'rgba(239, 68, 68, 0.38)' : undefined}
        onClick={onClick}
        onContextMenu={(event) => {
          event.preventDefault();
          onClear();
        }}
        onMouseEnter={item ? (event) => onHoverItem?.(event, item) : undefined}
        onMouseLeave={item ? onLeaveItem : undefined}
      />
      <span className={styles.hotkey} aria-hidden="true">
        {slotIndex + 1}
      </span>
    </div>
  );
}

function getActionBarSlotLabel(slotIndex: number, item?: Item) {
  if (!item) {
    return t('ui.actionBar.slot.emptyLabel', { hotkey: slotIndex + 1 });
  }

  return t('ui.actionBar.slot.filledLabel', {
    hotkey: slotIndex + 1,
    item: item.name,
  });
}
