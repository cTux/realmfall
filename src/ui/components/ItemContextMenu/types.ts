import type { Item, SecondaryStatKey } from '../../../game/state';

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
  reforgeOptions?: Array<{
    cost: number;
    key: SecondaryStatKey;
    statIndex: number;
  }>;
  enchantCost?: number | null;
  corruptCost?: number | null;
  onEquip: () => void;
  onUse: () => void;
  onDrop: () => void;
  onToggleLock?: () => void;
  onShowRecipes?: () => void;
  onProspect?: () => void;
  onReforge?: (statIndex: number) => void;
  onEnchant?: () => void;
  onCorrupt?: () => void;
  onSell?: () => void;
  onClose: () => void;
}
