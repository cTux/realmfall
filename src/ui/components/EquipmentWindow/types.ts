import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, EquipmentSlot, Item } from '../../../game/state';

export interface EquipmentWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  equipment: Equipment;
  onHoverItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onLeaveItem: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
}
