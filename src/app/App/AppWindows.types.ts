import type { MutableRefObject } from 'react';
import type {
  EquipmentSlot,
  GameState,
  Item,
  LogKind,
  Tile,
  getPlayerStats,
} from '../../game/state';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import type { TooltipLine } from '../../ui/tooltips';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import type { ItemContextMenuState, TooltipItem } from './types';

export interface AppWindowsProps {
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  worldTimeMs: number;
  stats: ReturnType<typeof getPlayerStats>;
  game: GameState;
  currentTile: Tile;
  recipeBookKnown: boolean;
  recipes: ReturnType<typeof import('../../game/state').getRecipeBookRecipes>;
  inventoryCounts: Record<string, number>;
  interactLabel: string | null;
  canProspect: boolean;
  canSell: boolean;
  claimStatus: ReturnType<
    typeof import('../../game/state').getCurrentHexClaimStatus
  >;
  prospectExplanation: string | null;
  sellExplanation: string | null;
  townStock: ReturnType<typeof import('../../game/state').getTownStock>;
  gold: number;
  renderLootWindow: boolean;
  lootWindowVisible: boolean;
  lootSnapshot: Item[];
  renderCombatWindow: boolean;
  combatWindowVisible: boolean;
  combatSnapshot: {
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof import('../../game/state').getEnemiesAt>;
  } | null;
  showFilterMenu: boolean;
  logFilters: Record<LogKind, boolean>;
  filteredLogs: GameState['logs'];
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  itemMenu: ItemContextMenuState | null;
  onMoveWindow: (
    key: keyof WindowPositions,
    position: WindowPositions[keyof WindowPositions],
  ) => void;
  onSetWindowVisibility: (
    key: keyof WindowVisibilityState,
    shown: boolean,
  ) => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  onShowItemTooltip: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
    equipped?: TooltipItem,
  ) => void;
  onShowTooltip: (
    event: React.MouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onCloseTooltip: () => void;
  onCloseItemMenu: () => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onSort: () => void;
  onEquip: (itemId: string) => void;
  onUseItem: (itemId: string) => void;
  onCraftRecipe: (recipeId: string) => void;
  onDropItem: (itemId: string) => void;
  onDropEquippedItem: (slot: EquipmentSlot) => void;
  onContextItem: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
  ) => void;
  onEquippedContextItem: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
    slot: EquipmentSlot,
  ) => void;
  onTakeLootItem: (itemId: string) => void;
  onTakeAllLoot: () => void;
  onStartCombat: () => void;
  onToggleFilterMenu: () => void;
  onToggleLogFilter: (kind: LogKind) => void;
  onEquipmentHover: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
  ) => void;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onBuyTownItem: (itemId: string) => void;
  onClaimHex: () => void;
  onSetHome: () => void;
}
