import type { EquipmentSlot, Item, LogKind } from '../../game/state';
import type { WindowVisibilityState } from '../constants';
import type { TooltipLine } from '../../ui/tooltips';
import type { TooltipPlacement } from '../../ui/tooltipPlacement';

export interface TooltipState {
  title: string;
  lines: TooltipLine[];
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
