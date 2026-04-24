import { useMemo } from 'react';
import type { GameState, LogKind } from '../../../game/stateTypes';
import type { AudioSettings } from '../../audioSettings';
import type { GraphicsSettings } from '../../graphicsSettings';
import type { ActionBarSlots } from '../actionBar';
import type { AppWindowsViewState } from '../AppWindows.types';
import type { ItemContextMenuState } from '../types';

type WindowViewsPlayerSlice = Pick<
  GameState['player'],
  | 'coord'
  | 'equipment'
  | 'hunger'
  | 'inventory'
  | 'learnedRecipeIds'
  | 'mana'
  | 'thirst'
>;

interface UseAppWindowViewsArgs {
  actionBarSlots: ActionBarSlots;
  audioSettings: AudioSettings;
  combatState: GameState['combat'];
  combatSnapshot: AppWindowsViewState['combat']['snapshot'];
  combatWindowVisible: boolean;
  currentTile: AppWindowsViewState['hex']['currentTile'];
  currentTileHostileEnemyCount: number;
  gold: number;
  graphicsSettings: GraphicsSettings;
  homeHex: GameState['homeHex'];
  inventoryCountsByItemKey: Record<string, number>;
  itemModification: AppWindowsViewState['hex']['itemModification'];
  itemMenu: ItemContextMenuState | null;
  claimStatus: AppWindowsViewState['hex']['claimStatus'];
  territoryNpcHealStatus: AppWindowsViewState['hex']['territoryNpcHealStatus'];
  interactLabel: string | null;
  filteredLogs: GameState['logs'];
  logFilters: Record<LogKind, boolean>;
  playerSlice: WindowViewsPlayerSlice;
  tileLootSnapshot: AppWindowsViewState['loot']['snapshot'];
  lootWindowVisible: boolean;
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  bulkProspectEquipmentExplanation: string | null;
  recipes: AppWindowsViewState['recipes']['entries'];
  recipeMaterialFilterItemKey: string | null;
  recipeSkillLevels: AppWindowsViewState['recipes']['skillLevels'];
  bulkSellEquipmentExplanation: string | null;
  showFilterMenu: boolean;
  heroOverview: AppWindowsViewState['hero']['overview'];
  townStock: AppWindowsViewState['hex']['townStock'];
}

export function useAppWindowViews({
  actionBarSlots,
  audioSettings,
  combatState,
  combatSnapshot,
  combatWindowVisible,
  currentTile,
  currentTileHostileEnemyCount,
  gold,
  graphicsSettings,
  homeHex,
  inventoryCountsByItemKey,
  itemModification,
  itemMenu,
  claimStatus,
  territoryNpcHealStatus,
  interactLabel,
  filteredLogs,
  logFilters,
  playerSlice,
  tileLootSnapshot,
  lootWindowVisible,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  bulkProspectEquipmentExplanation,
  recipes,
  recipeMaterialFilterItemKey,
  recipeSkillLevels,
  bulkSellEquipmentExplanation,
  showFilterMenu,
  heroOverview,
  townStock,
}: UseAppWindowViewsArgs): AppWindowsViewState {
  const hero = useMemo(
    () => ({
      overview: heroOverview,
      hunger: playerSlice.hunger,
      thirst: playerSlice.thirst,
    }),
    [heroOverview, playerSlice.hunger, playerSlice.thirst],
  );

  const player = useMemo(
    () => ({
      coord: playerSlice.coord,
      mana: playerSlice.mana,
    }),
    [playerSlice.coord, playerSlice.mana],
  );

  const inventory = useMemo(
    () => ({
      actionBarSlots,
      equipment: playerSlice.equipment,
      inventory: playerSlice.inventory,
      learnedRecipeIds: playerSlice.learnedRecipeIds,
    }),
    [
      actionBarSlots,
      playerSlice.equipment,
      playerSlice.inventory,
      playerSlice.learnedRecipeIds,
    ],
  );

  const hex = useMemo(
    () => ({
      homeHex,
      currentTile,
      currentTileHostileEnemyCount,
      combat: combatState,
      interactLabel,
      canBulkProspectEquipment,
      canBulkSellEquipment,
      itemModification,
      claimStatus,
      territoryNpcHealStatus,
      bulkProspectEquipmentExplanation,
      bulkSellEquipmentExplanation,
      townStock,
      gold,
    }),
    [
      canBulkProspectEquipment,
      canBulkSellEquipment,
      claimStatus,
      combatState,
      currentTile,
      currentTileHostileEnemyCount,
      gold,
      homeHex,
      interactLabel,
      itemModification,
      bulkProspectEquipmentExplanation,
      bulkSellEquipmentExplanation,
      territoryNpcHealStatus,
      townStock,
    ],
  );

  const recipeViews = useMemo(
    () => ({
      entries: recipes,
      skillLevels: recipeSkillLevels,
      inventoryCountsByItemKey,
      materialFilterItemKey: recipeMaterialFilterItemKey,
    }),
    [
      inventoryCountsByItemKey,
      recipeMaterialFilterItemKey,
      recipeSkillLevels,
      recipes,
    ],
  );

  const loot = useMemo(
    () => ({
      visible: lootWindowVisible,
      snapshot: tileLootSnapshot,
    }),
    [lootWindowVisible, tileLootSnapshot],
  );

  const combat = useMemo(
    () => ({
      visible: combatWindowVisible,
      snapshot: combatSnapshot,
    }),
    [combatSnapshot, combatWindowVisible],
  );

  const logs = useMemo(
    () => ({
      showFilterMenu,
      filters: logFilters,
      filtered: filteredLogs,
    }),
    [filteredLogs, logFilters, showFilterMenu],
  );

  const settings = useMemo(
    () => ({
      audio: audioSettings,
      graphics: graphicsSettings,
    }),
    [audioSettings, graphicsSettings],
  );

  return useMemo(
    () => ({
      hero,
      player,
      inventory,
      hex,
      recipes: recipeViews,
      loot,
      combat,
      logs,
      settings,
      itemMenu,
    }),
    [
      combat,
      hero,
      hex,
      inventory,
      itemMenu,
      logs,
      loot,
      player,
      recipeViews,
      settings,
    ],
  );
}
