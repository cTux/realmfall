import { useMemo } from 'react';
import {
  getCurrentHexClaimStatus,
  getEnemiesAt,
  getGoldAmount,
  getHostileEnemyIds,
  getPlayerStats,
  getRecipeBookEntries,
  Skill,
  structureActionLabel,
  type GameState,
  type LogKind,
} from '../../game/state';
import { buildTownStock } from '../../game/economy';
import { hexKey } from '../../game/hex';
import { isEquippableItem } from '../../game/inventory';
import { isPlayerClaim } from '../../game/territories';
import { buildTile } from '../../game/world';
import { t } from '../../i18n';

interface UseAppGameViewOptions {
  game: GameState;
  logFilters: Record<LogKind, boolean>;
}

type EnemyLookupInput = Parameters<typeof getEnemiesAt>[0];
type ClaimStatusInput = Parameters<typeof getCurrentHexClaimStatus>[0];

export function useAppGameView({ game, logFilters }: UseAppGameViewOptions) {
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

  const stats = useMemo(() => getPlayerStats(player), [player]);
  const currentTile = useMemo(
    () => tiles[hexKey(coord)] ?? buildTile(seed, coord),
    [coord, seed, tiles],
  );
  const recipes = useMemo(
    () => getRecipeBookEntries(learnedRecipeIds),
    [learnedRecipeIds],
  );
  const recipeSkillLevels = useMemo(
    () => ({
      [Skill.Gathering]: skills[Skill.Gathering].level,
      [Skill.Logging]: skills[Skill.Logging].level,
      [Skill.Mining]: skills[Skill.Mining].level,
      [Skill.Skinning]: skills[Skill.Skinning].level,
      [Skill.Fishing]: skills[Skill.Fishing].level,
      [Skill.Cooking]: skills[Skill.Cooking].level,
      [Skill.Smelting]: skills[Skill.Smelting].level,
      [Skill.Crafting]: skills[Skill.Crafting].level,
    }),
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
  const townStock = useMemo(
    () =>
      currentTile.structure === 'town'
        ? buildTownStock(seed, currentTile.coord)
        : [],
    [currentTile.coord, currentTile.structure, seed],
  );
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
    const claimedTiles = Object.values(tiles).filter((tile) =>
      isPlayerClaim(tile.claim),
    );
    const firstNonHomeClaim = claimedTiles.find(
      (tile) => tile.coord.q !== homeHex.q || tile.coord.r !== homeHex.r,
    );
    return firstNonHomeClaim?.coord ?? claimedTiles[0]?.coord ?? null;
  }, [homeHex, tiles]);

  const canProspectInventoryEquipment =
    currentTile.structure === 'forge' && hasUnlockedEquipmentInInventory;
  const canSellInventoryEquipment =
    currentTile.structure === 'town' && hasUnlockedEquipmentInInventory;
  const prospectInventoryEquipmentExplanation =
    currentTile.structure === 'forge' && !hasUnlockedEquipmentInInventory
      ? t('game.message.prospect.empty')
      : null;
  const sellInventoryEquipmentExplanation =
    currentTile.structure === 'town' && !hasUnlockedEquipmentInInventory
      ? t('game.message.sell.empty')
      : null;
  const interactLabel = structureActionLabel(currentTile.structure);
  const claimStatus = useMemo(
    () => getCurrentHexClaimStatus(claimStatusInput),
    [claimStatusInput],
  );

  return {
    claimStatus,
    canProspectInventoryEquipment,
    canSellInventoryEquipment,
    combatEnemies,
    currentTile,
    currentTileHostileEnemyCount,
    firstClaimedHex,
    filteredLogs,
    gold,
    interactLabel,
    inventoryCountsByItemKey,
    prospectInventoryEquipmentExplanation,
    recipes,
    recipeSkillLevels,
    sellInventoryEquipmentExplanation,
    stats,
    townStock,
  };
}
