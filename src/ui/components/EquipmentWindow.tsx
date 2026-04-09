import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Equipment, EquipmentSlot, Item } from '../../game/state';
import type { WindowPosition } from '../../app/constants';
import { EQUIPMENT_SLOTS } from '../../game/state';
import { iconForItem } from '../icons';
import { DraggableWindow } from './DraggableWindow';
import styles from './EquipmentWindow.module.css';

interface EquipmentWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  equipment: Equipment;
  onHoverItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onLeaveItem: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
}

export function EquipmentWindow({
  position,
  onMove,
  equipment,
  onHoverItem,
  onLeaveItem,
  onUnequip,
}: EquipmentWindowProps) {
  return (
    <DraggableWindow title="Equipment" position={position} onMove={onMove}>
      <div className={styles.inventory}>
        {EQUIPMENT_SLOTS.map((slot) => {
          const equipped = equipment[slot];
          return (
            <div key={slot} className={styles.slotRow}>
              <span className={styles.slotLabel}>{formatSlot(slot)}</span>
              <div
                className={`${styles.slotValue} ${equipped ? styles.slotInteractive : ''}`.trim()}
                onMouseEnter={
                  equipped ? (event) => onHoverItem(event, equipped) : undefined
                }
                onMouseLeave={onLeaveItem}
                onClick={equipped ? () => onUnequip(slot) : undefined}
              >
                <img
                  className={styles.slotIcon}
                  src={iconForItem(equipped, slot)}
                  alt="Slot icon"
                />
                <strong className={equipped ? undefined : styles.slotEmpty}>
                  {equipped?.name ?? 'Empty'}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </DraggableWindow>
  );
}

function formatSlot(slot: EquipmentSlot) {
  return slot
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}
