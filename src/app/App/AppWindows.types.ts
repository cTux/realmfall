import type { MutableRefObject } from 'react';
import type {
  EquipmentSlot,
  GameState,
  Item,
  LogKind,
  Skill,
  Tile,
  getPlayerStats,
} from '../../game/state';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import type { TooltipLine } from '../../ui/tooltips';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import type { GraphicsSettings } from '../graphicsSettings';
import type { ItemContextMenuState, TooltipItem } from './types';

export interface AppWindowsProps {
  layout: AppWindowsLayout;
  views: AppWindowsViewState;
  actions: AppWindowsActions;
}

export interface AppWindowsLayout {
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  renderLootWindow: boolean;
  renderCombatWindow: boolean;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
}

export interface AppWindowsViewState {
  worldTimeMs: number;
  stats: ReturnType<typeof getPlayerStats>;
  game: GameState;
  currentTile: Tile;
  graphicsSettings: GraphicsSettings;
  recipes: ReturnType<typeof import('../../game/state').getRecipeBookEntries>;
  recipeSkillLevels: Record<Skill, number>;
  inventoryCountsByItemKey: Record<string, number>;
  recipeMaterialFilterItemKey: string | null;
  interactLabel: string | null;
  canProspectInventoryEquipment: boolean;
  canSellInventoryEquipment: boolean;
  claimStatus: ReturnType<
    typeof import('../../game/state').getCurrentHexClaimStatus
  >;
  prospectInventoryEquipmentExplanation: string | null;
  sellInventoryEquipmentExplanation: string | null;
  townStock: ReturnType<typeof import('../../game/state').getTownStock>;
  gold: number;
  lootWindowVisible: boolean;
  lootSnapshot: Item[];
  combatWindowVisible: boolean;
  combatSnapshot: {
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof import('../../game/state').getEnemiesAt>;
  } | null;
  showFilterMenu: boolean;
  logFilters: Record<LogKind, boolean>;
  filteredLogs: GameState['logs'];
  itemMenu: ItemContextMenuState | null;
}

export interface AppWindowsActions {
  windows: {
    onMoveWindow: (
      key: keyof WindowPositions,
      position: WindowPositions[keyof WindowPositions],
    ) => void;
    onSetWindowVisibility: (
      key: keyof WindowVisibilityState,
      shown: boolean,
    ) => void;
    onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
  };
  tooltip: {
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
    onEquipmentHover: (
      event: React.MouseEvent<HTMLElement>,
      item: TooltipItem,
    ) => void;
  };
  inventory: {
    onUnequip: (slot: EquipmentSlot) => void;
    onSort: () => void;
    onEquip: (itemId: string) => void;
    onUseItem: (itemId: string) => void;
    onCraftRecipe: (recipeId: string, count?: number | 'max') => void;
    onDropItem: (itemId: string) => void;
    onDropEquippedItem: (slot: EquipmentSlot) => void;
    onProspectItem: (itemId: string) => void;
    onSellItem: (itemId: string) => void;
    onSetItemLocked: (itemId: string, locked: boolean) => void;
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
  };
  world: {
    onStartCombat: () => void;
    onInteract: () => void;
    onProspect: () => void;
    onSellAll: () => void;
    onBuyTownItem: (itemId: string) => void;
    onClaimHex: () => void;
    onSetHome: () => void;
  };
  recipes: {
    onOpenWithMaterialFilter: (itemKey: string) => void;
    onClearMaterialFilter: () => void;
  };
  logs: {
    onToggleFilterMenu: () => void;
    onToggleLogFilter: (kind: LogKind) => void;
  };
  settings: {
    onResetSaveData: () => void;
    onSaveGraphicsSettings: (settings: GraphicsSettings) => Promise<void>;
    onSaveGraphicsSettingsAndReload: (
      settings: GraphicsSettings,
    ) => Promise<void>;
  };
}
