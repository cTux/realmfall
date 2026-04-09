import type { Item } from '../../../game/state';

export interface ItemContextMenuProps {
  item: Item;
  x: number;
  y: number;
  canEquip: boolean;
  canUse: boolean;
  onEquip: () => void;
  onUse: () => void;
  onDrop: () => void;
  onClose: () => void;
}
