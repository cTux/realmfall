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
import type { AudioSettings } from '../audioSettings';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import type { GraphicsSettings } from '../graphicsSettings';
import type { ActionBarSlots } from './actionBar';
import type { ItemContextMenuState, TooltipItem } from './types';

export interface AppWindowsProps {
  layout: AppWindowsLayout;
  views: AppWindowsViewState;
  actions: AppWindowsActions;
}

export type AppWindowsRawClaimStatus = ReturnType<
  typeof import('../../game/state').getCurrentHexClaimStatus
>;

export interface AppWindowsLayout {
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  keepLootWindowMounted: boolean;
  keepCombatWindowMounted: boolean;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
}

export interface AppWindowsViewState {
  hero: {
    stats: ReturnType<typeof getPlayerStats>;
    hunger: GameState['player']['hunger'];
    thirst: GameState['player']['thirst'];
  };
  player: {
    coord: GameState['player']['coord'];
    mana: GameState['player']['mana'];
    actionBarSlots: ActionBarSlots;
    equipment: GameState['player']['equipment'];
    inventory: GameState['player']['inventory'];
    learnedRecipeIds: GameState['player']['learnedRecipeIds'];
  };
  world: {
    homeHex: GameState['homeHex'];
    currentTile: Tile;
    currentTileHostileEnemyCount: number;
    combat: GameState['combat'];
    interactLabel: string | null;
    canBulkProspectEquipment: boolean;
    canBulkSellEquipment: boolean;
    claimStatus: ReturnType<
      typeof import('../../game/state').getCurrentHexClaimStatus
    > & {
      actionLabel: string;
    };
    bulkProspectEquipmentExplanation: string | null;
    bulkSellEquipmentExplanation: string | null;
    townStock: ReturnType<typeof import('../../game/state').getTownStock>;
    gold: number;
  };
  recipes: {
    entries: ReturnType<typeof import('../../game/state').getRecipeBookEntries>;
    skillLevels: Record<Skill, number>;
    inventoryCountsByItemKey: Record<string, number>;
    materialFilterItemKey: string | null;
  };
  loot: {
    visible: boolean;
    snapshot: Item[];
  };
  combat: {
    visible: boolean;
    snapshot: {
      combat: NonNullable<GameState['combat']>;
      enemies: ReturnType<typeof import('../../game/state').getEnemiesAt>;
    } | null;
  };
  logs: {
    showFilterMenu: boolean;
    filters: Record<LogKind, boolean>;
    filtered: GameState['logs'];
  };
  settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  };
  itemMenu: ItemContextMenuState | null;
}

export type AppWindowsRawViewState = Omit<AppWindowsViewState, 'world'> & {
  world: Omit<AppWindowsViewState['world'], 'claimStatus'> & {
    claimStatus: AppWindowsRawClaimStatus;
  };
};

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
    onShowActionBarItemTooltip: (
      event: React.MouseEvent<HTMLElement>,
      item: TooltipItem,
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
    onActivateItem: (itemId: string) => void;
    onEquipItem: (itemId: string) => void;
    onUseItem: (itemId: string) => void;
    onAssignActionBarSlot: (slotIndex: number, item: Item) => void;
    onClearActionBarSlot: (slotIndex: number) => void;
    onUseActionBarSlot: (slotIndex: number) => void;
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
    onSaveSettings: (settings: {
      audio: AudioSettings;
      graphics: GraphicsSettings;
    }) => Promise<void>;
    onSaveSettingsAndReload: (settings: {
      audio: AudioSettings;
      graphics: GraphicsSettings;
    }) => Promise<void>;
  };
}
