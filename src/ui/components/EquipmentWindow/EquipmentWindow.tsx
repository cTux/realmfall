import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../game/state';
import { iconForItem } from '../../icons';
import { DraggableWindow } from '../DraggableWindow';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.css';

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
