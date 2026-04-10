import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Item, TownStockEntry } from '../../../game/state';

export interface HexInfoWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  terrain: string;
  structure: string;
  enemyCount: number;
  interactLabel?: string | null;
  canInteract: boolean;
  canProspect: boolean;
  canSell: boolean;
  prospectExplanation?: string | null;
  sellExplanation?: string | null;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  structureHp?: number;
  structureMaxHp?: number;
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
