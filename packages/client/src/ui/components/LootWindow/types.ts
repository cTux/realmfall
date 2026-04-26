import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Equipment, Item } from '../../../game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface LootWindowProps
  extends
    Omit<ManagedWindowShellProps, 'onClose'>,
    WindowDetailTooltipHandlers {
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
