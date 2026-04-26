import type { TooltipLine } from '../../ui/tooltips';
import type { AudioSettings } from '../audioSettings';
import type { WindowPositions, WindowVisibilityState } from '../constants';
import type { GraphicsSettings } from '../graphicsSettings';
import type { ResettableSaveAreaId } from '../../persistence/saveAreas';
import type { EquipmentSlot, Item, LogKind } from '../../game/stateTypes';
import type { TooltipItem } from './types';

export interface WindowActions {
  onMoveWindow: (
    key: keyof WindowPositions,
    position: WindowPositions[keyof WindowPositions],
  ) => void;
  onSetWindowVisibility: (
    key: keyof WindowVisibilityState,
    shown: boolean,
  ) => void;
  onToggleDockWindow: (key: keyof WindowVisibilityState) => void;
}

export interface TooltipActions {
  onShowItemTooltip: (
    event: React.MouseEvent<HTMLElement>,
    item: TooltipItem,
    equipped?: TooltipItem,
    quickSellHint?: boolean,
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
}

export interface InventoryActions {
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
  onReforgeItem: (itemId: string, statIndex: number) => void;
  onEnchantItem: (itemId: string) => void;
  onCorruptItem: (itemId: string) => void;
  onSelectHexItemModificationItem: (item: Item) => void;
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
}

export interface HexActions {
  onStartCombat: () => void;
  onForfeitCombat: () => void;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onBuyTownItem: (itemId: string) => void;
  onClaimHex: () => void;
  onHealTerritoryNpc: () => void;
  onApplySelectedItemModification: () => void;
  onClearSelectedItemModification: () => void;
  onSelectItemModificationReforgeStat: (statIndex: number) => void;
  onToggleItemModificationPicker: () => void;
  onSetHome: () => void;
}

export interface RecipesActions {
  onOpenWithMaterialFilter: (itemKey: string) => void;
  onClearMaterialFilter: () => void;
  onToggleFavoriteRecipe: (recipeId: string) => void;
}

export interface LogActions {
  onToggleFilterMenu: () => void;
  onToggleLogFilter: (kind: LogKind) => void;
}

export interface SettingsActions {
  onResetSaveArea: (areaId: ResettableSaveAreaId) => Promise<void>;
  onSaveSettings: (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => Promise<void>;
  onSaveSettingsAndReload: (settings: {
    audio: AudioSettings;
    graphics: GraphicsSettings;
  }) => Promise<void>;
}

export interface AppWindowsActions {
  windows: WindowActions;
  tooltip: TooltipActions;
  inventory: InventoryActions;
  hex: HexActions;
  recipes: RecipesActions;
  logs: LogActions;
  settings: SettingsActions;
}
