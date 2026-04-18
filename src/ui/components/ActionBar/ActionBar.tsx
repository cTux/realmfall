import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { t } from '../../../i18n';
import type { Item } from '../../../game/state';
import {
  ACTION_BAR_SLOT_COUNT,
  findActionBarItem,
  getConsumablesFromInventory,
  type ActionBarSlots,
} from '../../../app/App/actionBar';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import styles from './styles.module.scss';

interface ActionBarProps {
  inventory: Item[];
  slots: ActionBarSlots;
  onAssignSlot: (slotIndex: number, item: Item) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}

export function ActionBar({
  inventory,
  slots,
  onAssignSlot,
  onHoverItem,
  onLeaveItem,
}: ActionBarProps) {
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const consumables = getConsumablesFromInventory(inventory);

  useEffect(() => {
    if (pickerSlotIndex === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setPickerSlotIndex(null);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [pickerSlotIndex]);

  return (
    <div className={styles.root} ref={rootRef}>
      {pickerSlotIndex !== null ? (
        <div
          className={styles.picker}
          role="dialog"
          aria-label={t('ui.actionBar.picker.title')}
        >
          <div className={styles.pickerHeader}>
            {t('ui.actionBar.picker.title')}
          </div>
          <div className={styles.pickerGrid}>
            {consumables.map((item) => (
              <ItemSlotButton
                key={item.id}
                ariaLabel={t('ui.actionBar.picker.optionLabel', {
                  item: item.name,
                })}
                item={item}
                size="compact"
                onClick={() => {
                  onAssignSlot(pickerSlotIndex, item);
                  setPickerSlotIndex(null);
                }}
                onMouseEnter={(event) => onHoverItem(event, item)}
                onMouseLeave={onLeaveItem}
              />
            ))}
            {consumables.length === 0 ? (
              <div className={styles.empty}>
                {t('ui.actionBar.picker.empty')}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={styles.bar} aria-label={t('ui.actionBar.ariaLabel')}>
        {Array.from({ length: ACTION_BAR_SLOT_COUNT }, (_, slotIndex) => {
          const assigned = slots[slotIndex];
          const linkedItem = findActionBarItem(inventory, assigned);
          const displayItem = linkedItem ?? assigned?.item;
          const depleted = Boolean(assigned && !linkedItem);

          return (
            <div key={slotIndex} className={styles.slotWrap}>
              <ItemSlotButton
                ariaLabel={getActionBarSlotLabel(slotIndex, displayItem)}
                className={styles.slot}
                item={displayItem}
                size="compact"
                overlayColorOverride={
                  depleted ? 'rgba(239, 68, 68, 0.38)' : undefined
                }
                onClick={() =>
                  setPickerSlotIndex((current) =>
                    current === slotIndex ? null : slotIndex,
                  )
                }
                onMouseEnter={
                  displayItem
                    ? (event) => onHoverItem(event, displayItem)
                    : undefined
                }
                onMouseLeave={displayItem ? onLeaveItem : undefined}
              />
              <span className={styles.hotkey} aria-hidden="true">
                {slotIndex + 1}
              </span>
            </div>
          );
        })}
      </div>
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
