import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Equipment, Item } from '../../../game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface InventoryWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  inventory: Item[];
  equipment: Equipment;
  hexItemModificationPickerActive?: boolean;
  learnedRecipeIds: string[];
  onSort: () => void;
  onActivateItem: (itemId: string) => void;
  onSellItem: (itemId: string) => void;
  onContextItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onSelectHexItemModificationItem?: (item: Item) => void;
  inTownForQuickSell?: boolean;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}
