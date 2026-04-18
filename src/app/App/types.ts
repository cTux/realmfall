import type { EquipmentSlot, Item, LogKind } from '../../game/state';
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
  windowCollapsed?: Partial<WindowVisibilityState>;
  actionBarSlots?: ActionBarSlots;
}

export type TooltipItem = Item;

export interface ItemContextMenuState {
  item: Item;
  x: number;
  y: number;
  slot?: EquipmentSlot;
  canProspectInventoryEquipment: boolean;
  canSellInventoryEquipment: boolean;
}
