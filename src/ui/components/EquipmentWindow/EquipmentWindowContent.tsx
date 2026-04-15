import type { CSSProperties } from 'react';
import silhouetteImage from '../../../assets/images/silhouette.png';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../game/state';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.scss';

type EquipmentWindowContentProps = Omit<
  EquipmentWindowProps,
  'position' | 'onMove' | 'visible' | 'onClose'
>;

export function EquipmentWindowContent({
  equipment,
  onHoverItem,
  onLeaveItem,
  onUnequip,
  onContextItem,
}: EquipmentWindowContentProps) {
  return (
    <div className={styles.layout}>
      <div
        className={styles.figure}
        style={{ backgroundImage: `url("${silhouetteImage}")` }}
      />
      {EQUIPMENT_SLOTS.map((slot) => {
        const equipped = equipment[slot];
        const position = SLOT_POSITIONS[slot];
        return (
          <ItemSlotButton
            key={slot}
            item={equipped}
            slot={slot}
            className={styles.slot}
            onClick={equipped ? () => onUnequip(slot) : undefined}
            onContextMenu={
              equipped ? (event) => onContextItem(event, equipped, slot) : undefined
            }
            onMouseEnter={
              equipped ? (event) => onHoverItem(event, equipped) : undefined
            }
            onMouseLeave={onLeaveItem}
            style={
              {
                '--slot-left': `${position.left}%`,
                '--slot-top': `${position.top}%`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

const SLOT_POSITIONS: Record<EquipmentSlot, { left: number; top: number }> = {
  weapon: { left: 13, top: 35 },
  offhand: { left: 87, top: 35 },
  head: { left: 50, top: 8 },
  chest: { left: 50, top: 30 },
  hands: { left: 18, top: 48 },
  legs: { left: 50, top: 55 },
  feet: { left: 50, top: 82 },
  ringLeft: { left: 14, top: 61 },
  ringRight: { left: 86, top: 61 },
  amulet: { left: 50, top: 18 },
  cloak: { left: 18, top: 22 },
  relic: { left: 82, top: 22 },
};
