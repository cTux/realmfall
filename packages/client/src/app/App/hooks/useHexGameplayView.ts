import { useMemo } from 'react';
import { isEquippableItem } from '@realmfall/core/game/inventory';
import {
  canModifyItem,
  formatReforgeableItemSecondaryStatLabel,
  getItemModificationCost,
  getItemModificationKindForStructure,
  getItemModificationStructureHint,
  getReforgeableItemSecondaryStats,
} from '@realmfall/core/game/itemModifications';
import {
  getCurrentHexClaimStatus,
  getEnemiesAt,
  getGoldAmount,
  getHostileEnemyIds,
  getTownStockForDay,
} from '@realmfall/core/game/stateSelectors';
import { getActiveWorld } from '@realmfall/core/game/dungeons/worldState';
import { getResolvedCurrentHexClaimStatus } from '@realmfall/core/game/stateClaims';
import { getCombatEncounterEnemyIds } from '@realmfall/core/game/stateCombatEngagement';
import {
  FACTION_NPC_HEAL_COST,
  getCurrentHexFactionNpcHealStatus,
} from '@realmfall/core/game/stateFactionNpc';
import { getResolvedCurrentHexOutpostBuildStatus } from '@realmfall/core/game/stateOutposts';
import { getResolvedTileAt } from '@realmfall/core/game/stateWorldQueries';
import type { GameState, Item } from '@realmfall/core/game/stateTypes';
import { isGatheringStructure } from '@realmfall/core/game/world';
import { t } from '../../../i18n';
import type { HexInteractAction } from '../AppWindows.viewTypes';

const EMPTY_TOWN_STOCK: ReturnType<typeof getTownStockForDay> = [];

interface HexGameplayViewDemand {
  hexTownStock: boolean;
}

const FULL_HEX_GAMEPLAY_VIEW_DEMAND: HexGameplayViewDemand = {
  hexTownStock: true,
};

interface UseHexGameplayViewOptions {
  activeWorldId?: GameState['activeWorldId'];
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
  viewDemand?: HexGameplayViewDemand;
  worlds?: GameState['worlds'];
  worldDayIndex: number;
}

type EnemyLookupInput = Parameters<typeof getEnemiesAt>[0];
type ClaimStatusInput = Parameters<typeof getCurrentHexClaimStatus>[0];
type FactionNpcHealStatusInput = Parameters<
  typeof getCurrentHexFactionNpcHealStatus
>[0];
type OutpostBuildStatusInput = Parameters<
  typeof getResolvedCurrentHexOutpostBuildStatus
>[0];

export function useHexGameplayView({
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
  viewDemand = FULL_HEX_GAMEPLAY_VIEW_DEMAND,
  worlds,
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
  const outpostBuildStatusInput = useMemo<OutpostBuildStatusInput>(
    () => ({
      activeWorldId,
      combat,
      player: {
        coord,
        inventory,
      },
      tiles,
      worlds,
    }),
    [activeWorldId, combat, coord, inventory, tiles, worlds],
  );
  const resolvedCurrentTile = useMemo(
    () => getResolvedTileAt({ tiles }, coord),
    [coord, tiles],
  );

  const currentTile = useMemo(
    () =>
      resolvedCurrentTile ?? {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
    [coord, resolvedCurrentTile],
  );
  const gold = useMemo(() => getGoldAmount(inventory), [inventory]);
  const hasUnlockedEquipmentInInventory = useMemo(
    () => inventory.some((item) => isEquippableItem(item) && !item.locked),
    [inventory],
  );
  const townStock = useMemo(
    () =>
      viewDemand.hexTownStock && resolvedCurrentTile
        ? getTownStockForDay({
            player: { coord },
            seed,
            tiles,
            worldDayIndex,
          })
        : EMPTY_TOWN_STOCK,
    [
      coord,
      resolvedCurrentTile,
      seed,
      tiles,
      viewDemand.hexTownStock,
      worldDayIndex,
    ],
  );
  const combatEnemies = useMemo(
    () =>
      combat
        ? getCombatEncounterEnemyIds(combat)
            .map((enemyId) => enemyLookupInput.enemies[enemyId])
            .filter((enemy): enemy is NonNullable<typeof enemy> =>
              Boolean(enemy),
            )
        : [],
    [combat, enemyLookupInput],
  );
  const currentTileHostileEnemyCount = useMemo(
    () =>
      resolvedCurrentTile
        ? getHostileEnemyIds(enemyLookupInput, resolvedCurrentTile.coord).length
        : 0,
    [enemyLookupInput, resolvedCurrentTile],
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
            label: formatReforgeableItemSecondaryStatLabel(entry),
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
  const claimStatus = useMemo(
    () => getResolvedCurrentHexClaimStatus(claimStatusInput),
    [claimStatusInput],
  );
  const territoryNpcHealStatus = useMemo(
    () =>
      resolvedCurrentTile
        ? getCurrentHexFactionNpcHealStatus(factionNpcHealStatusInput)
        : {
            canHeal: false,
            cost: FACTION_NPC_HEAL_COST,
            reason: t('game.message.factionNpcHeal.noResident'),
          },
    [factionNpcHealStatusInput, resolvedCurrentTile],
  );
  const outpostBuildStatus = useMemo(
    () => getResolvedCurrentHexOutpostBuildStatus(outpostBuildStatusInput),
    [outpostBuildStatusInput],
  );
  const currentWorldKind = useMemo(
    () => getActiveWorld({ activeWorldId, worlds })?.kind ?? 'surface',
    [activeWorldId, worlds],
  );
  const interactAction = useMemo<HexInteractAction | null>(
    () =>
      resolveHexInteractAction({
        currentStructure: currentTile.structure,
        currentWorldKind,
      }),
    [currentTile.structure, currentWorldKind],
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
    currentWorldKind,
    gold,
    interactAction,
    itemModification,
    outpostBuildStatus,
    territoryNpcHealStatus,
    townStock,
  };
}

function resolveHexInteractAction({
  currentStructure,
  currentWorldKind,
}: {
  currentStructure: GameState['tiles'][string]['structure'];
  currentWorldKind: 'surface' | 'dungeon';
}): HexInteractAction | null {
  if (currentStructure === 'dungeon') {
    return currentWorldKind === 'dungeon' ? 'leave-dungeon' : 'enter-dungeon';
  }

  if (currentStructure === 'dungeon-chest') {
    return 'open-dungeon-chest';
  }

  return isGatheringStructure(currentStructure) ? 'gather' : null;
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
