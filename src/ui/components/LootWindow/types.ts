import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, Item } from '../../../game/state';

export interface LootWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  loot: Item[];
  equipment: Equipment;
  onClose: () => void;
  onTakeAll: () => void;
  onTakeItem: (itemId: string) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}
