import type { CSSProperties } from 'react';
import silhouetteImage from '../../../assets/images/silhouette.png';
import { EquipmentSlotId } from '../../../game/content/ids';
import { t } from '../../../i18n';
import { formatEquipmentSlotLabel } from '../../../i18n/labels';
import { isOffhandSlotDisabled } from '../../../game/state';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.scss';

type EquipmentWindowContentProps = Omit<
  EquipmentWindowProps,
  'position' | 'onMove' | 'visible' | 'onClose'
>;

type PaperDollSlot = Exclude<`${EquipmentSlotId}`, `${EquipmentSlotId.Relic}`>;

const PAPER_DOLL_SLOTS: PaperDollSlot[] = [
  EquipmentSlotId.Weapon,
  EquipmentSlotId.Offhand,
  EquipmentSlotId.Head,
  EquipmentSlotId.Shoulders,
  EquipmentSlotId.Chest,
  EquipmentSlotId.Bracers,
  EquipmentSlotId.Hands,
  EquipmentSlotId.Belt,
  EquipmentSlotId.Legs,
  EquipmentSlotId.Feet,
  EquipmentSlotId.RingLeft,
  EquipmentSlotId.RingRight,
  EquipmentSlotId.Amulet,
  EquipmentSlotId.Cloak,
];

export function EquipmentWindowContent({
  equipment,
  onHoverItem,
  onLeaveItem,
  onUnequip,
  onContextItem,
  onHoverDetail,
}: EquipmentWindowContentProps) {
  const offhandDisabled = isOffhandSlotDisabled(equipment);

  return (
    <div className={styles.layout}>
      <div
        className={styles.figure}
        style={{ backgroundImage: `url("${silhouetteImage}")` }}
      />
      {PAPER_DOLL_SLOTS.map((slot) => {
        const equipped = equipment[slot];
        const position = SLOT_POSITIONS[slot];
        const compactSlot = COMPACT_SLOTS.has(slot);
        const slotSize = compactSlot ? 19 : 38;
        const disabled = slot === 'offhand' && offhandDisabled;
        return (
          <ItemSlotButton
            key={slot}
            item={equipped}
            slot={slot}
            className={styles.slot}
            hidePlaceholderIconWhenEmpty
            disabled={disabled}
            onClick={equipped ? () => onUnequip(slot) : undefined}
            onContextMenu={
              equipped
                ? (event) => onContextItem(event, equipped, slot)
                : undefined
            }
            onMouseEnter={
              equipped ? (event) => onHoverItem(event, equipped) : undefined
            }
            onEmptyMouseEnter={
              equipped
                ? undefined
                : (event) =>
                    onHoverDetail?.(
                      event,
                      formatEquipmentSlotLabel(slot),
                      [
                        {
                          kind: 'text',
                          text: t('ui.tooltip.emptyEquipmentSlot', {
                            slot: formatEquipmentSlotLabel(slot).toLowerCase(),
                          }),
                        },
                      ],
                      'rgba(148, 163, 184, 0.9)',
                    )
            }
            onMouseLeave={onLeaveItem}
            style={
              {
                position: 'absolute',
                left: `${position.left}%`,
                top: `${position.top}%`,
                transform: 'translate(-50%, -50%)',
                width: `${slotSize}px`,
                height: `${slotSize}px`,
                padding: compactSlot ? '0.06rem' : '0.12rem',
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

const SLOT_POSITIONS: Record<PaperDollSlot, { left: number; top: number }> = {
  head: { left: 50, top: 12.5 },
  shoulders: { left: 74.5, top: 16.25 },
  amulet: { left: 25.5, top: 22 },
  cloak: { left: 50, top: 24.75 },
  chest: { left: 50, top: 36.5 },
  bracers: { left: 82.25, top: 41 },
  hands: { left: 17.75, top: 41 },
  belt: { left: 50, top: 49.5 },
  ringLeft: { left: 24.5, top: 55.75 },
  weapon: { left: 18.25, top: 69.75 },
  legs: { left: 50, top: 64.25 },
  offhand: { left: 81.75, top: 69.75 },
  ringRight: { left: 75.5, top: 55.75 },
  feet: { left: 50, top: 83.5 },
};

const COMPACT_SLOTS = new Set<PaperDollSlot>([
  'amulet',
  'ringLeft',
  'ringRight',
]);
