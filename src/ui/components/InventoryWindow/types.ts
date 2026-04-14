import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, Item } from '../../../game/state';
import type { TooltipLine } from '../../tooltips';

export interface InventoryWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  inventory: Item[];
  equipment: Equipment;
  onSort: () => void;
  onEquip: (itemId: string) => void;
  onContextItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
