import type { Item } from '../../../game/state';

export interface ItemContextMenuProps {
  item: Item;
  x: number;
  y: number;
  equipLabel?: string;
  canEquip: boolean;
  canUse: boolean;
  canToggleLock?: boolean;
  isLocked?: boolean;
  canShowRecipes?: boolean;
  canProspectItem?: boolean;
  canSellEntry?: boolean;
  onEquip: () => void;
  onUse: () => void;
  onDrop: () => void;
  onToggleLock?: () => void;
  onShowRecipes?: () => void;
  onProspect?: () => void;
  onSell?: () => void;
  onClose: () => void;
}
