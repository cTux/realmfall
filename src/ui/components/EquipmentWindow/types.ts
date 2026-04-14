import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, EquipmentSlot, Item } from '../../../game/state';
import type { TooltipLine } from '../../tooltips';

export interface EquipmentWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  equipment: Equipment;
  onHoverItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onLeaveItem: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onContextItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    slot: EquipmentSlot,
  ) => void;
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
