import { useMemo } from 'react';
import { createSkillRecord } from '@realmfall/core/game/skillRecords';
import {
  getPlayerClaimedTiles,
  getPlayerOverview,
  getRecipeBookEntries,
} from '@realmfall/core/game/stateSelectors';
import type {
  GameState,
  Item,
  LogKind,
  Skill,
} from '@realmfall/core/game/stateTypes';
import { t } from '../../i18n';
import { resolveBackgroundMusicMood } from '../audio/backgroundMusic';
import type { HexInteractAction } from './AppWindows.viewTypes';
import { useHexGameplayView } from './hooks/useHexGameplayView';

const EMPTY_FILTERED_LOGS: GameState['logs'] = [];
const EMPTY_RECIPES: ReturnType<typeof getRecipeBookEntries> = [];
const EMPTY_RECIPE_SKILL_LEVELS: Record<Skill, number> = createSkillRecord(
  () => 0,
);

interface UseAppGameViewDemand {
  logs: boolean;
  recipes: boolean;
  hexTownStock: boolean;
}

const FULL_APP_GAME_VIEW_DEMAND: UseAppGameViewDemand = {
  logs: true,
  recipes: true,
  hexTownStock: true,
};

interface UseAppGameViewOptions {
  activeWorldId: GameState['activeWorldId'];
  bloodMoonActive: GameState['bloodMoonActive'];
  combat: GameState['combat'];
  enemies: GameState['enemies'];
  hexItemModificationPickerActive: boolean;
  homeHex: GameState['homeHex'];
  logFilters: Record<LogKind, boolean>;
  logs: GameState['logs'];
  player: GameState['player'];
  seed: GameState['seed'];
  selectedHexItemModificationItem: Item | null;
  selectedHexItemReforgeStatIndex: number | null;
  tiles: GameState['tiles'];
  viewDemand?: UseAppGameViewDemand;
  worlds: GameState['worlds'];
  worldDayIndex: number;
}

export function useAppGameView({
  activeWorldId,
  bloodMoonActive,
  combat,
  enemies,
  hexItemModificationPickerActive,
  homeHex,
  logFilters,
  logs,
  player,
  seed,
  selectedHexItemModificationItem,
  selectedHexItemReforgeStatIndex,
  tiles,
  viewDemand = FULL_APP_GAME_VIEW_DEMAND,
  worlds,
  worldDayIndex,
}: UseAppGameViewOptions) {
  const { inventory, learnedRecipeIds, skills } = player;
  const { favoriteRecipeIds } = player;
  const hexGameplay = useHexGameplayView({
    activeWorldId,
    bloodMoonActive,
    combat,
    enemies,
    hexItemModificationPickerActive,
    homeHex,
    player,
    seed,
    selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex,
    tiles,
    viewDemand: {
      hexTownStock: viewDemand.hexTownStock,
    },
    worlds,
    worldDayIndex,
  });
  const heroOverview = useMemo(() => getPlayerOverview(player), [player]);
  const recipes = useMemo(
    () =>
      viewDemand.recipes
        ? getRecipeBookEntries(learnedRecipeIds, favoriteRecipeIds)
        : EMPTY_RECIPES,
    [favoriteRecipeIds, learnedRecipeIds, viewDemand.recipes],
  );
  const recipeSkillLevels = useMemo(
    () =>
      viewDemand.recipes
        ? createSkillRecord((skill) => skills[skill].level)
        : EMPTY_RECIPE_SKILL_LEVELS,
    [skills, viewDemand.recipes],
  );
  const inventoryCountsByItemKey = useMemo(
    () =>
      inventory.reduce<Record<string, number>>((counts, item) => {
        const key = item.itemKey;
        if (!key) {
          return counts;
        }
        counts[key] = (counts[key] ?? 0) + item.quantity;
        return counts;
      }, {}),
    [inventory],
  );
  const filteredLogs = useMemo(
    () =>
      viewDemand.logs
        ? logs.filter((entry) => logFilters[entry.kind])
        : EMPTY_FILTERED_LOGS,
    [logFilters, logs, viewDemand.logs],
  );
  const firstClaimedHex = useMemo(() => {
    const playerClaims = getPlayerClaimedTiles({ tiles });
    const firstNonHomeClaim = playerClaims.find(
      (tile) => tile.coord.q !== homeHex.q || tile.coord.r !== homeHex.r,
    );

    if (firstNonHomeClaim) {
      return firstNonHomeClaim.coord;
    }

    return playerClaims[0]?.coord ?? null;
  }, [homeHex, tiles]);
  const backgroundMusicMood = useMemo(
    () =>
      resolveBackgroundMusicMood({
        combat,
        currentWorldKind: hexGameplay.currentWorldKind,
        currentStructure: hexGameplay.currentTile.structure,
      }),
    [combat, hexGameplay.currentTile.structure, hexGameplay.currentWorldKind],
  );

  return {
    backgroundMusicMood,
    claimStatus: hexGameplay.claimStatus,
    canBulkProspectEquipment: hexGameplay.canBulkProspectEquipment,
    canBulkSellEquipment: hexGameplay.canBulkSellEquipment,
    combatEnemies: hexGameplay.combatEnemies,
    currentTile: hexGameplay.currentTile,
    currentTileHostileEnemyCount: hexGameplay.currentTileHostileEnemyCount,
    currentWorldKind: hexGameplay.currentWorldKind,
    firstClaimedHex,
    filteredLogs,
    gold: hexGameplay.gold,
    interactAction: hexGameplay.interactAction,
    itemModification: hexGameplay.itemModification,
    inventoryCountsByItemKey,
    bulkProspectEquipmentExplanation:
      hexGameplay.bulkProspectEquipmentExplanation,
    outpostBuildStatus: hexGameplay.outpostBuildStatus,
    recipes,
    recipeSkillLevels,
    bulkSellEquipmentExplanation: hexGameplay.bulkSellEquipmentExplanation,
    heroOverview,
    townStock: hexGameplay.townStock,
    territoryNpcHealStatus: hexGameplay.territoryNpcHealStatus,
  };
}

export function getHexInteractActionLabel({
  interactAction,
}: {
  interactAction: HexInteractAction | null;
}) {
  if (interactAction === 'gather') {
    return t('ui.hexInfo.interactAction');
  }

  if (interactAction === 'enter-dungeon') {
    return t('ui.hexInfo.enterDungeonAction');
  }

  if (interactAction === 'leave-dungeon') {
    return t('ui.hexInfo.leaveDungeonAction');
  }

  if (interactAction === 'open-dungeon-chest') {
    return t('ui.hexInfo.openDungeonChestAction');
  }

  return null;
}
