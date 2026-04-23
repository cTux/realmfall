import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, Item } from '../../../game/stateTypes';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface LootWindowProps extends WindowDetailTooltipHandlers {
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
