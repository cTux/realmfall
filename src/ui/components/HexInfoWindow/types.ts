import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Item, TerritoryNpc, TownStockEntry } from '../../../game/state';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface HexInfoWindowProps extends WindowDetailTooltipHandlers {
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
  canProspectInventoryEquipment: boolean;
  canSellInventoryEquipment: boolean;
  canClaim: boolean;
  claimExplanation?: string | null;
  prospectInventoryEquipmentExplanation?: string | null;
  sellInventoryEquipmentExplanation?: string | null;
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
}
