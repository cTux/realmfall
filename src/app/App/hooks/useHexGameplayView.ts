import { useMemo } from 'react';
import { hexKey } from '../../../game/hex';
import { isEquippableItem } from '../../../game/inventory';
import {
  canModifyItem,
  getItemModificationCost,
  getItemModificationKindForStructure,
  getItemModificationStructureHint,
  getReforgeableItemSecondaryStats,
} from '../../../game/itemModifications';
import {
  getCurrentHexClaimStatus,
  getEnemiesAt,
  getGoldAmount,
  getHostileEnemyIds,
  getTownStockForDay,
} from '../../../game/stateSelectors';
import { getCurrentHexFactionNpcHealStatus } from '../../../game/stateFactionNpc';
import type { GameState, Item } from '../../../game/stateTypes';
import { buildTile, structureActionLabel } from '../../../game/world';
import { t } from '../../../i18n';
import { formatSecondaryStatLabel } from '../../../i18n/labels';

interface UseHexGameplayViewOptions {
  bloodMoonActive: GameState['bloodMoonActive'];
  combat: GameState['combat'];
  enemies: GameState['enemies'];
  hexItemModificationPickerActive: boolean;
  homeHex: GameState['homeHex'];
  player: GameState['player'];
  seed: GameState['seed'];
  selectedHexItemModificationItem: Item | null;
  selectedHexItemReforgeStatIndex: number | null;
  tiles: GameState['tiles'];
  worldDayIndex: number;
}

type EnemyLookupInput = Parameters<typeof getEnemiesAt>[0];
type ClaimStatusInput = Parameters<typeof getCurrentHexClaimStatus>[0];
type FactionNpcHealStatusInput = Parameters<
  typeof getCurrentHexFactionNpcHealStatus
>[0];

export function useHexGameplayView({
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
}: UseHexGameplayViewOptions) {
  const { coord, inventory } = player;
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

  const currentTile = useMemo(
    () => tiles[hexKey(coord)] ?? buildTile(seed, coord),
    [coord, seed, tiles],
  );
  const gold = useMemo(() => getGoldAmount(inventory), [inventory]);
  const hasUnlockedEquipmentInInventory = useMemo(
    () => inventory.some((item) => isEquippableItem(item) && !item.locked),
    [inventory],
  );
  const townStock = useMemo(
    () =>
      getTownStockForDay({
        player: { coord },
        seed,
        tiles,
        worldDayIndex,
      }),
    [coord, seed, tiles, worldDayIndex],
  );
  const combatEnemies = useMemo(
    () => (combat ? getEnemiesAt(enemyLookupInput, combat.coord) : []),
    [combat, enemyLookupInput],
  );
  const currentTileHostileEnemyCount = useMemo(
    () => getHostileEnemyIds(enemyLookupInput, currentTile.coord).length,
    [currentTile.coord, enemyLookupInput],
  );
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

  return {
    bulkProspectEquipmentExplanation,
    bulkSellEquipmentExplanation,
    canBulkProspectEquipment,
    canBulkSellEquipment,
    claimStatus,
    combatEnemies,
    currentTile,
    currentTileHostileEnemyCount,
    gold,
    interactLabel,
    itemModification,
    territoryNpcHealStatus,
    townStock,
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
