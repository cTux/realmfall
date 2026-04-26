import type { EquipmentSlot, Item, LogKind } from '../../game/stateTypes';
import type { SecondaryStatKey } from '../../game/types';
import type { WindowVisibilityState } from '../constants';
import type { TooltipLine } from '../../ui/tooltips';
import type { TooltipPlacement } from '../../ui/tooltipPlacement';
import type { ActionBarSlots } from './actionBar';

export interface TooltipState {
  title: string;
  lines: TooltipLine[];
  contentKey?: string;
  x: number;
  y: number;
  placement?: TooltipPlacement;
  borderColor?: string;
  followCursor?: boolean;
}

export interface PersistedUiState {
  logFilters?: Record<LogKind, boolean>;
  windowShown?: WindowVisibilityState;
  actionBarSlots?: ActionBarSlots;
}

export type TooltipItem = Item;

export interface ItemContextMenuState {
  item: Item;
  x: number;
  y: number;
  slot?: EquipmentSlot;
  canProspectItem: boolean;
  canSellEntry: boolean;
  reforgeOptions: Array<{
    cost: number;
    key: SecondaryStatKey;
    statIndex: number;
  }>;
  enchantCost: number | null;
  corruptCost: number | null;
}
