import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Item, TerritoryNpc, TownStockEntry } from '../../../game/state';
import type { TooltipLine } from '../../tooltips';

export interface HexInfoWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  isHome: boolean;
  onSetHome: () => void;
  canSetHome?: boolean;
  terrain: string;
  structure?: string | null;
  enemyCount: number;
  interactLabel?: string | null;
  canInteract: boolean;
  canProspect: boolean;
  canSell: boolean;
  canClaim: boolean;
  claimExplanation?: string | null;
  prospectExplanation?: string | null;
  sellExplanation?: string | null;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onClaim: () => void;
  structureHp?: number;
  structureMaxHp?: number;
  territoryName?: string | null;
  territoryOwnerType?: 'player' | 'faction' | null;
  territoryNpc: TerritoryNpc | null;
  townStock: TownStockEntry[];
  gold: number;
  onBuyItem: (itemId: string) => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
