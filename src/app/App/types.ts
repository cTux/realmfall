import type { EquipmentSlot, Item, LogKind } from '../../game/state';
import type { WindowVisibilityState } from '../constants';
import type { TooltipLine } from '../../ui/tooltips';

export interface TooltipState {
  title: string;
  lines: TooltipLine[];
  x: number;
  y: number;
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
}
