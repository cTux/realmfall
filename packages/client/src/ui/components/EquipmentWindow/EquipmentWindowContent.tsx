import { ItemSlot as ItemSlotButton } from '@realmfall/ui-react';
import type { CSSProperties } from 'react';
import silhouetteImage from '../../../assets/images/silhouette.png';
import { EquipmentSlotId } from '@realmfall/core/game/content/ids';
import { isOffhandSlotDisabled } from '@realmfall/core/game/stateSelectors';
import { EQUIPMENT_WINDOW_LAYOUT } from '../../../client.config';
import { t } from '../../../i18n';
import { formatEquipmentSlotLabel } from '../../../i18n/labels';
import { TOOLTIP_BORDER_COLORS } from '../../../theme.config';
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

const REDUCED_RADIUS_SLOTS = new Set<PaperDollSlot>(
  EQUIPMENT_WINDOW_LAYOUT.reducedRadiusSlots,
);

export function EquipmentWindowContent({
  equipment,
  hexItemModificationPickerActive = false,
  onHoverItem,
  onLeaveItem,
  onUnequip,
  onContextItem,
  onSelectHexItemModificationItem,
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
        const position = EQUIPMENT_WINDOW_LAYOUT.slotPositions[slot];
        const compactSlot = COMPACT_SLOTS.has(slot);
        const reducedRadiusSlot = REDUCED_RADIUS_SLOTS.has(slot);
        const slotSize = compactSlot
          ? EQUIPMENT_WINDOW_LAYOUT.slotSizePx.compact
          : EQUIPMENT_WINDOW_LAYOUT.slotSizePx.regular;
        const disabled = slot === 'offhand' && offhandDisabled;
        return (
          <ItemSlotButton
            key={slot}
            item={equipped}
            slot={slot}
            className={styles.slot}
            hidePlaceholderIconWhenEmpty
            disabled={disabled}
            onClick={
              equipped
                ? () => {
                    if (hexItemModificationPickerActive) {
                      onSelectHexItemModificationItem?.(equipped);
                      return;
                    }

                    onUnequip(slot);
                  }
                : undefined
            }
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
                      TOOLTIP_BORDER_COLORS.neutral,
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
                padding: `${compactSlot ? EQUIPMENT_WINDOW_LAYOUT.slotPaddingRem.compact : EQUIPMENT_WINDOW_LAYOUT.slotPaddingRem.regular}rem`,
                borderRadius: reducedRadiusSlot
                  ? EQUIPMENT_WINDOW_LAYOUT.reducedRadiusBorderRadius
                  : undefined,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

const COMPACT_SLOTS = new Set<PaperDollSlot>(
  EQUIPMENT_WINDOW_LAYOUT.compactSlots,
);
