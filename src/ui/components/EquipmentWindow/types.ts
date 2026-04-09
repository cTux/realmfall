import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, EquipmentSlot, Item } from '../../../game/state';

export interface EquipmentWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  equipment: Equipment;
  onHoverItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onLeaveItem: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onContextItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    slot: EquipmentSlot,
  ) => void;
}
