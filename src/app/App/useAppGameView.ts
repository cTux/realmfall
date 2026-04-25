import { useMemo } from 'react';
import { createSkillRecord } from '../../game/skillRecords';
import {
  getPlayerClaimedTiles,
  getPlayerOverview,
  getRecipeBookEntries,
} from '../../game/stateSelectors';
import type { GameState, Item, LogKind } from '../../game/stateTypes';
import { resolveBackgroundMusicMood } from '../audio/backgroundMusic';
import { useHexGameplayView } from './hooks/useHexGameplayView';

interface UseAppGameViewOptions {
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
  worldDayIndex: number;
}

export function useAppGameView({
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
  worldDayIndex,
}: UseAppGameViewOptions) {
  const { inventory, learnedRecipeIds, skills } = player;
  const { favoriteRecipeIds } = player;
  const hexGameplay = useHexGameplayView({
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
        currentStructure: hexGameplay.currentTile.structure,
      }),
    [combat, hexGameplay.currentTile.structure],
  );

  return {
    backgroundMusicMood,
    claimStatus: hexGameplay.claimStatus,
    canBulkProspectEquipment: hexGameplay.canBulkProspectEquipment,
    canBulkSellEquipment: hexGameplay.canBulkSellEquipment,
    combatEnemies: hexGameplay.combatEnemies,
    currentTile: hexGameplay.currentTile,
    currentTileHostileEnemyCount: hexGameplay.currentTileHostileEnemyCount,
    firstClaimedHex,
    filteredLogs,
    gold: hexGameplay.gold,
    itemModification: hexGameplay.itemModification,
    interactLabel: hexGameplay.interactLabel,
    inventoryCountsByItemKey,
    bulkProspectEquipmentExplanation:
      hexGameplay.bulkProspectEquipmentExplanation,
    recipes,
    recipeSkillLevels,
    bulkSellEquipmentExplanation: hexGameplay.bulkSellEquipmentExplanation,
    heroOverview,
    townStock: hexGameplay.townStock,
    territoryNpcHealStatus: hexGameplay.territoryNpcHealStatus,
  };
}
