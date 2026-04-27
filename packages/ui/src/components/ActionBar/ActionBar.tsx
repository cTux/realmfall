import {
  memo,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { t } from '../../../i18n';
import type { Item } from '../../../game/stateTypes';
import type { ActionBarSlots } from '../../../app/App/actionBar';
import { ActionBarSlot } from './ActionBarSlot';
import { useActionBarItems } from './hooks/useActionBarItems';
import styles from './styles.module.scss';

export interface ActionBarProps {
  inventory: Item[];
  slots: ActionBarSlots;
  onAssignSlot: (slotIndex: number, item: Item) => void;
  onClearSlot: (slotIndex: number) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}

export const ActionBar = memo(function ActionBar({
  inventory,
  slots,
  onAssignSlot,
  onClearSlot,
  onHoverItem,
  onLeaveItem,
}: ActionBarProps) {
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { consumables, slotItems } = useActionBarItems(inventory, slots);

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
        {slotItems.map(({ slotIndex, displayItem, depleted }) => (
          <ActionBarSlot
            key={slotIndex}
            slotIndex={slotIndex}
            item={displayItem}
            depleted={depleted}
            onClick={() =>
              setPickerSlotIndex((current) =>
                current === slotIndex ? null : slotIndex,
              )
            }
            onClear={() => {
              setPickerSlotIndex(null);
              onClearSlot(slotIndex);
            }}
            onHoverItem={onHoverItem}
            onLeaveItem={onLeaveItem}
          />
        ))}
      </div>
    </div>
  );
});
