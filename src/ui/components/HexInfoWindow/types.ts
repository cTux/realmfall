import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { Item, TownStockEntry } from '../../../game/state';

export interface HexInfoWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  isHome: boolean;
  onSetHome: () => void;
  terrain: string;
  structure?: string | null;
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
