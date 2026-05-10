import { useMemo } from 'react';
import { createSkillRecord } from '@realmfall/core/game/skillRecords';
import {
  getPlayerClaimedTiles,
  getPlayerOverview,
  getRecipeBookEntries,
} from '@realmfall/core/game/stateSelectors';
import type { GameState, Item, LogKind } from '@realmfall/core/game/stateTypes';
import { t } from '../../i18n';
import { resolveBackgroundMusicMood } from '../audio/backgroundMusic';
import type { HexInteractAction } from './AppWindows.viewTypes';
import { useHexGameplayView } from './hooks/useHexGameplayView';

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
    worlds,
    worldDayIndex,
  });
  const heroOverview = useMemo(() => getPlayerOverview(player), [player]);
  const recipes = useMemo(
    () => getRecipeBookEntries(learnedRecipeIds, favoriteRecipeIds),
    [learnedRecipeIds, favoriteRecipeIds],
  );
  const recipeSkillLevels = useMemo(
    () => createSkillRecord((skill) => skills[skill].level),
    [skills],
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
    () => logs.filter((entry) => logFilters[entry.kind]),
    [logFilters, logs],
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
