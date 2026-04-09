import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, Item } from '../../../game/state';

export interface InventoryWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  inventory: Item[];
  equipment: Equipment;
  canProspect: boolean;
  canSell: boolean;
  onSort: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onEquip: (itemId: string) => void;
  onContextItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}
