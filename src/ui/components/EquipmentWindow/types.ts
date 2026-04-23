import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Equipment, EquipmentSlot, Item } from '../../../game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface EquipmentWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  equipment: Equipment;
  hexItemModificationPickerActive?: boolean;
  onHoverItem: (event: ReactMouseEvent<HTMLElement>, item: Item) => void;
  onLeaveItem: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onContextItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    slot: EquipmentSlot,
  ) => void;
  onSelectHexItemModificationItem?: (item: Item) => void;
}
