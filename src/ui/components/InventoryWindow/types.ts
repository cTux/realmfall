import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Equipment, Item } from '../../../game/stateTypes';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface InventoryWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  inventory: Item[];
  equipment: Equipment;
  hexItemModificationPickerActive?: boolean;
  learnedRecipeIds: string[];
  onSort: () => void;
  onActivateItem: (itemId: string) => void;
  onContextItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onSelectHexItemModificationItem?: (item: Item) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}
