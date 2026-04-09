import type { EquipmentSlot, Item, LogKind } from '../../game/state';
import type { TooltipLine } from '../../ui/tooltips';

export interface TooltipState {
  title: string;
  lines: TooltipLine[];
  x: number;
  y: number;
  borderColor?: string;
}

export interface PersistedUiState {
  logFilters?: Record<LogKind, boolean>;
}

export type TooltipItem = Item;

export interface ItemContextMenuState {
  item: Item;
  x: number;
  y: number;
  slot?: EquipmentSlot;
}
