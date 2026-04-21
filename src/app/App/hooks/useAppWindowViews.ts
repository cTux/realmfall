import { useMemo } from 'react';
import type { GameState, LogKind } from '../../../game/state';
import type { AudioSettings } from '../../audioSettings';
import type { GraphicsSettings } from '../../graphicsSettings';
import type { ActionBarSlots } from '../actionBar';
import type { ItemContextMenuState } from '../types';
import type {
  AppWindowsRawClaimStatus,
  AppWindowsRawViewState,
} from '../AppWindows.types';

interface UseAppWindowViewsArgs {
  actionBarSlots: ActionBarSlots;
  audioSettings: AudioSettings;
  combatSnapshot: AppWindowsRawViewState['combat']['snapshot'];
  combatWindowVisible: boolean;
  currentTile: AppWindowsRawViewState['world']['currentTile'];
  currentTileHostileEnemyCount: number;
  game: GameState;
  gold: number;
  graphicsSettings: GraphicsSettings;
  inventoryCountsByItemKey: Record<string, number>;
  itemMenu: ItemContextMenuState | null;
  claimStatus: AppWindowsRawClaimStatus;
  interactLabel: string | null;
  filteredLogs: GameState['logs'];
  logFilters: Record<LogKind, boolean>;
  lootSnapshot: GameState['player']['inventory'];
  lootWindowVisible: boolean;
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  bulkProspectEquipmentExplanation: string | null;
  recipes: AppWindowsRawViewState['recipes']['entries'];
  recipeMaterialFilterItemKey: string | null;
  recipeSkillLevels: AppWindowsRawViewState['recipes']['skillLevels'];
  bulkSellEquipmentExplanation: string | null;
  showFilterMenu: boolean;
  stats: AppWindowsRawViewState['hero']['stats'];
  townStock: AppWindowsRawViewState['world']['townStock'];
}

export function useAppWindowViews({
  actionBarSlots,
  audioSettings,
  combatSnapshot,
  combatWindowVisible,
  currentTile,
  currentTileHostileEnemyCount,
  game,
  gold,
  graphicsSettings,
  inventoryCountsByItemKey,
  itemMenu,
  claimStatus,
  interactLabel,
  filteredLogs,
  logFilters,
  lootSnapshot,
  lootWindowVisible,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  bulkProspectEquipmentExplanation,
  recipes,
  recipeMaterialFilterItemKey,
  recipeSkillLevels,
  bulkSellEquipmentExplanation,
  showFilterMenu,
  stats,
  townStock,
}: UseAppWindowViewsArgs): AppWindowsRawViewState {
  const hero = useMemo(
    () => ({
      stats,
      hunger: game.player.hunger,
      thirst: game.player.thirst,
    }),
    [game.player.hunger, game.player.thirst, stats],
  );

  const player = useMemo(
    () => ({
      coord: game.player.coord,
      mana: game.player.mana,
      actionBarSlots,
      equipment: game.player.equipment,
      inventory: game.player.inventory,
      learnedRecipeIds: game.player.learnedRecipeIds,
    }),
    [
      actionBarSlots,
      game.player.coord,
      game.player.equipment,
      game.player.inventory,
      game.player.learnedRecipeIds,
      game.player.mana,
    ],
  );

  const world = useMemo(
    () => ({
      homeHex: game.homeHex,
      currentTile,
      currentTileHostileEnemyCount,
      combat: game.combat,
      interactLabel,
      canBulkProspectEquipment,
      canBulkSellEquipment,
      claimStatus,
      bulkProspectEquipmentExplanation,
      bulkSellEquipmentExplanation,
      townStock,
      gold,
    }),
    [
      canBulkProspectEquipment,
      canBulkSellEquipment,
      claimStatus,
      currentTile,
      currentTileHostileEnemyCount,
      game.combat,
      game.homeHex,
      gold,
      interactLabel,
      bulkProspectEquipmentExplanation,
      bulkSellEquipmentExplanation,
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
      snapshot: lootSnapshot,
    }),
    [lootSnapshot, lootWindowVisible],
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
      world,
      recipes: recipeViews,
      loot,
      combat,
      logs,
      settings,
      itemMenu,
    }),
    [combat, hero, itemMenu, logs, loot, player, recipeViews, settings, world],
  );
}
