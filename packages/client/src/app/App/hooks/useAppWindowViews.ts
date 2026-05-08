import { useMemo } from 'react';
import type { GameState, LogKind } from '../../../game/stateTypes';
import type { AudioSettings } from '../../audioSettings';
import type { GameplaySettings } from '../../gameplaySettings';
import type { GraphicsSettings } from '../../graphicsSettings';
import type { InterfaceSettings } from '../../interfaceSettings';
import type { ActionBarSlots } from '../actionBar';
import type { AppWindowsViewState } from '../AppWindows.types';
import type { ItemContextMenuState } from '../types';

type WindowViewsPlayerState = Pick<
  GameState['player'],
  | 'coord'
  | 'equipment'
  | 'hunger'
  | 'inventory'
  | 'learnedRecipeIds'
  | 'mana'
  | 'thirst'
  | 'level'
>;

interface UseAppWindowViewsArgs {
  actionBarSlots: ActionBarSlots;
  audioSettings: AudioSettings;
  combatState: GameState['combat'];
  combatSnapshot: AppWindowsViewState['combat']['snapshot'];
  combatWindowVisible: boolean;
  currentTile: AppWindowsViewState['hex']['currentTile'];
  currentTileHostileEnemyCount: number;
  gameplaySettings: GameplaySettings;
  gold: number;
  graphicsSettings: GraphicsSettings;
  homeHex: GameState['homeHex'];
  inventoryCountsByItemKey: Record<string, number>;
  itemModification: AppWindowsViewState['hex']['itemModification'];
  itemMenu: ItemContextMenuState | null;
  interfaceSettings: InterfaceSettings;
  claimStatus: AppWindowsViewState['hex']['claimStatus'];
  outpostBuildStatus: AppWindowsViewState['hex']['outpostBuildStatus'];
  territoryNpcHealStatus: AppWindowsViewState['hex']['territoryNpcHealStatus'];
  interactLabel: string | null;
  filteredLogs: GameState['logs'];
  logFilters: Record<LogKind, boolean>;
  playerState: WindowViewsPlayerState;
  tileLootSnapshot: AppWindowsViewState['loot']['snapshot'];
  lootWindowVisible: boolean;
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  bulkProspectEquipmentExplanation: string | null;
  recipes: AppWindowsViewState['recipes']['entries'];
  preferredRecipeSkill: AppWindowsViewState['recipes']['preferredSkill'];
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
  gameplaySettings,
  gold,
  graphicsSettings,
  homeHex,
  inventoryCountsByItemKey,
  itemModification,
  itemMenu,
  interfaceSettings,
  claimStatus,
  outpostBuildStatus,
  territoryNpcHealStatus,
  interactLabel,
  filteredLogs,
  logFilters,
  playerState,
  tileLootSnapshot,
  lootWindowVisible,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  bulkProspectEquipmentExplanation,
  recipes,
  preferredRecipeSkill,
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
      hunger: playerState.hunger,
      thirst: playerState.thirst,
    }),
    [heroOverview, playerState.hunger, playerState.thirst],
  );

  const player = useMemo(
    () => ({
      coord: playerState.coord,
      mana: playerState.mana,
    }),
    [playerState.coord, playerState.mana],
  );

  const inventory = useMemo(
    () => ({
      actionBarSlots,
      level: playerState.level,
      equipment: playerState.equipment,
      inventory: playerState.inventory,
      learnedRecipeIds: playerState.learnedRecipeIds,
    }),
    [
      actionBarSlots,
      playerState.level,
      playerState.equipment,
      playerState.inventory,
      playerState.learnedRecipeIds,
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
      outpostBuildStatus,
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
      outpostBuildStatus,
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
      preferredSkill: preferredRecipeSkill,
      materialFilterItemKey: recipeMaterialFilterItemKey,
    }),
    [
      inventoryCountsByItemKey,
      preferredRecipeSkill,
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
      gameplay: gameplaySettings,
      graphics: graphicsSettings,
      interface: interfaceSettings,
    }),
    [audioSettings, gameplaySettings, graphicsSettings, interfaceSettings],
  );

  const debug = useMemo(() => ({}), []);

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
      debug,
      itemMenu,
    }),
    [
      combat,
      debug,
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
