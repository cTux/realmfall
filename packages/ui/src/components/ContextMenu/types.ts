import type { ItemView } from '../../game/stateTypes';

export interface ItemContextMenuProps {
  item: ItemView;
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
    label: string;
    statIndex: number;
  }>;
  enchantCost?: number | null;
  corruptCost?: number | null;
  corruptBreakChancePercent?: number | null;
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
