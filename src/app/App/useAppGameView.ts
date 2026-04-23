import { useMemo } from 'react';
import { hexKey } from '../../game/hex';
import { isEquippableItem } from '../../game/inventory';
import {
  canModifyItem,
  getItemModificationCost,
  getItemModificationKindForStructure,
  getItemModificationStructureHint,
  getReforgeableItemSecondaryStats,
} from '../../game/itemModifications';
import { createSkillRecord } from '../../game/skillRecords';
import {
  getCurrentHexClaimStatus,
  getEnemiesAt,
  getGoldAmount,
  getHostileEnemyIds,
  getPlayerClaimedTiles,
  getPlayerOverview,
  getRecipeBookEntries,
  getTownStock,
} from '../../game/stateSelectors';
import { getCurrentHexFactionNpcHealStatus } from '../../game/stateFactionNpc';
import type { GameState, Item, LogKind } from '../../game/stateTypes';
import { buildTile } from '../../game/world';
import { structureActionLabel } from '../../game/world';
import { t } from '../../i18n';
import { formatSecondaryStatLabel } from '../../i18n/labels';
import { resolveBackgroundMusicMood } from '../audio/backgroundMusic';

interface UseAppGameViewOptions {
  game: GameState;
  hexItemModificationPickerActive: boolean;
  logFilters: Record<LogKind, boolean>;
  selectedHexItemModificationItem: Item | null;
  selectedHexItemReforgeStatIndex: number | null;
}

type EnemyLookupInput = Parameters<typeof getEnemiesAt>[0];
type ClaimStatusInput = Parameters<typeof getCurrentHexClaimStatus>[0];
type FactionNpcHealStatusInput = Parameters<
  typeof getCurrentHexFactionNpcHealStatus
>[0];

export function useAppGameView({
  game,
  hexItemModificationPickerActive,
  logFilters,
  selectedHexItemModificationItem,
  selectedHexItemReforgeStatIndex,
}: UseAppGameViewOptions) {
  const {
    bloodMoonActive,
    combat,
    enemies,
    homeHex,
    logs,
    player,
    seed,
    tiles,
  } = game;
  const { coord, inventory, learnedRecipeIds, skills } = player;
  const enemyLookupInput = useMemo<EnemyLookupInput>(
    () => ({
      enemies,
      bloodMoonActive,
      seed,
      tiles,
    }),
    [bloodMoonActive, enemies, seed, tiles],
  );
  const claimStatusInput = useMemo<ClaimStatusInput>(
    () => ({
      bloodMoonActive,
      enemies,
      homeHex,
      player: {
        coord,
        inventory,
      },
      seed,
      tiles,
    }),
    [bloodMoonActive, coord, enemies, homeHex, inventory, seed, tiles],
  );
  const factionNpcHealStatusInput = useMemo<FactionNpcHealStatusInput>(
    () => ({
      player,
      seed,
      tiles,
    }),
    [player, seed, tiles],
  );

  const stats = useMemo(() => getPlayerOverview(player), [player]);
  const currentTile = useMemo(
    () => tiles[hexKey(coord)] ?? buildTile(seed, coord),
    [coord, seed, tiles],
  );
  const recipes = useMemo(
    () => getRecipeBookEntries(learnedRecipeIds),
    [learnedRecipeIds],
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
  const hasUnlockedEquipmentInInventory = useMemo(
    () => inventory.some((item) => isEquippableItem(item) && !item.locked),
    [inventory],
  );
  const townStock = useMemo(() => getTownStock(game), [game]);
  const gold = useMemo(() => getGoldAmount(inventory), [inventory]);
  const combatEnemies = useMemo(
    () => (combat ? getEnemiesAt(enemyLookupInput, combat.coord) : []),
    [combat, enemyLookupInput],
  );
  const currentTileHostileEnemyCount = useMemo(
    () => getHostileEnemyIds(enemyLookupInput, currentTile.coord).length,
    [currentTile.coord, enemyLookupInput],
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

  const canBulkProspectEquipment =
    currentTile.structure === 'forge' && hasUnlockedEquipmentInInventory;
  const canBulkSellEquipment =
    currentTile.structure === 'town' && hasUnlockedEquipmentInInventory;
  const itemModification = useMemo(() => {
    const kind = getItemModificationKindForStructure(currentTile.structure);
    if (!kind) {
      return null;
    }

    const selectedItem = selectedHexItemModificationItem;
    const hint = getItemModificationStructureHint(currentTile.structure) ?? '';
    const reforgeOptions =
      kind === 'reforge' && selectedItem
        ? getReforgeableItemSecondaryStats(selectedItem).map((entry) => ({
            label: formatSecondaryStatLabel(entry.stat.key),
            statIndex: entry.index,
          }))
        : [];
    const resolvedReforgeStatIndex =
      kind !== 'reforge'
        ? null
        : reforgeOptions.some(
              (entry) => entry.statIndex === selectedHexItemReforgeStatIndex,
            )
          ? selectedHexItemReforgeStatIndex
          : (reforgeOptions[0]?.statIndex ?? null);
    const actionCost = selectedItem
      ? getItemModificationCost(selectedItem, kind)
      : null;
    const canAfford = actionCost == null || gold >= actionCost;
    const disabledReason = getItemModificationDisabledReason({
      actionCost,
      canAfford,
      kind,
      reforgeOptions,
      selectedItem,
      selectedReforgeStatIndex: resolvedReforgeStatIndex,
    });

    return {
      kind,
      hint,
      pickerActive: hexItemModificationPickerActive,
      selectedItem,
      actionCost,
      canAfford,
      canApply: disabledReason == null,
      disabledReason,
      reforgeOptions,
      selectedReforgeStatIndex: resolvedReforgeStatIndex,
    };
  }, [
    currentTile.structure,
    gold,
    hexItemModificationPickerActive,
    selectedHexItemModificationItem,
    selectedHexItemReforgeStatIndex,
  ]);
  const bulkProspectEquipmentExplanation =
    currentTile.structure === 'forge' && !hasUnlockedEquipmentInInventory
      ? t('game.message.prospect.empty')
      : null;
  const bulkSellEquipmentExplanation =
    currentTile.structure === 'town' && !hasUnlockedEquipmentInInventory
      ? t('game.message.sell.empty')
      : null;
  const interactLabel = structureActionLabel(currentTile.structure);
  const claimStatus = useMemo(
    () => getCurrentHexClaimStatus(claimStatusInput),
    [claimStatusInput],
  );
  const territoryNpcHealStatus = useMemo(
    () => getCurrentHexFactionNpcHealStatus(factionNpcHealStatusInput),
    [factionNpcHealStatusInput],
  );
  const backgroundMusicMood = useMemo(
    () =>
      resolveBackgroundMusicMood({
        combat,
        currentStructure: currentTile.structure,
      }),
    [combat, currentTile.structure],
  );

  return {
    backgroundMusicMood,
    claimStatus,
    canBulkProspectEquipment,
    canBulkSellEquipment,
    combatEnemies,
    currentTile,
    currentTileHostileEnemyCount,
    firstClaimedHex,
    filteredLogs,
    gold,
    itemModification,
    interactLabel,
    inventoryCountsByItemKey,
    bulkProspectEquipmentExplanation,
    recipes,
    recipeSkillLevels,
    bulkSellEquipmentExplanation,
    stats,
    townStock,
    territoryNpcHealStatus,
  };
}

function getItemModificationDisabledReason({
  actionCost,
  canAfford,
  kind,
  reforgeOptions,
  selectedItem,
  selectedReforgeStatIndex,
}: {
  actionCost: number | null;
  canAfford: boolean;
  kind: 'reforge' | 'enchant' | 'corrupt';
  reforgeOptions: Array<{ label: string; statIndex: number }>;
  selectedItem: Item | null;
  selectedReforgeStatIndex: number | null;
}) {
  if (!selectedItem) {
    return t('ui.hexInfo.itemModification.reason.selectItem');
  }

  if (!canModifyItem(selectedItem)) {
    return t('ui.hexInfo.itemModification.reason.corrupted');
  }

  if (kind === 'reforge') {
    if (reforgeOptions.length === 0) {
      return t('ui.hexInfo.itemModification.reason.noEligibleStat');
    }

    if (selectedReforgeStatIndex == null) {
      return t('ui.hexInfo.itemModification.reason.selectStat');
    }
  }

  if (!canAfford && actionCost != null) {
    return t('ui.hexInfo.itemModification.reason.needsGold', {
      gold: actionCost,
    });
  }

  return null;
}
