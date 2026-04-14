import { memo } from 'react';
import { t } from '../../../i18n';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../game/state';
import { formatEquipmentSlotLabel } from '../../../i18n/labels';
import { iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import labelStyles from '../windowLabels.module.scss';
import type { EquipmentWindowProps } from './types';
import styles from './styles.module.scss';

export const EquipmentWindow = memo(function EquipmentWindow({
  position,
  onMove,
  visible,
  onClose,
  equipment,
  onHoverItem,
  onLeaveItem,
  onUnequip,
  onContextItem,
  onHoverDetail,
  onLeaveDetail,
}: EquipmentWindowProps) {
  return (
    <DraggableWindow
      title={
        <WindowLabel
          label={WINDOW_LABELS.equipment}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
      position={position}
      onMove={onMove}
      visible={visible}
      onClose={onClose}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
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
                onContextMenu={
                  equipped
                    ? (event) => onContextItem(event, equipped, slot)
                    : undefined
                }
              >
                <span
                  className={styles.slotIcon}
                  style={iconMaskStyle(
                    iconForItem(equipped, slot),
                    equipped
                      ? rarityColor(equipped.rarity)
                      : 'rgba(148, 163, 184, 0.32)',
                  )}
                />
                <strong
                  className={equipped ? undefined : styles.slotEmpty}
                  style={
                    equipped
                      ? { color: rarityColor(equipped.rarity) }
                      : undefined
                  }
                >
                  {equipped?.name ?? t('ui.common.empty')}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </DraggableWindow>
  );
});

function formatSlot(slot: EquipmentSlot) {
  return formatEquipmentSlotLabel(slot);
}

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
