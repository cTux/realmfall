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

export function useAppGameView({ game, logFilters }: UseAppGameViewOptions) {
  const { combat, homeHex, logs, player, seed, tiles } = game;

  const stats = useMemo(() => getPlayerStats(player), [player]);
  const currentTile = useMemo(
    () => tiles[hexKey(player.coord)] ?? buildTile(seed, player.coord),
    [player.coord, seed, tiles],
  );
  const recipes = useMemo(
    () => getRecipeBookEntries(player.learnedRecipeIds),
    [player.learnedRecipeIds],
  );
  const recipeSkillLevels = useMemo(
    () => ({
      [Skill.Gathering]: player.skills[Skill.Gathering].level,
      [Skill.Logging]: player.skills[Skill.Logging].level,
      [Skill.Mining]: player.skills[Skill.Mining].level,
      [Skill.Skinning]: player.skills[Skill.Skinning].level,
      [Skill.Fishing]: player.skills[Skill.Fishing].level,
      [Skill.Cooking]: player.skills[Skill.Cooking].level,
      [Skill.Smelting]: player.skills[Skill.Smelting].level,
      [Skill.Crafting]: player.skills[Skill.Crafting].level,
    }),
    [player.skills],
  );
  const inventoryCountsByItemKey = useMemo(
    () =>
      player.inventory.reduce<Record<string, number>>((counts, item) => {
        const key = item.itemKey ?? item.name;
        counts[key] = (counts[key] ?? 0) + item.quantity;
        return counts;
      }, {}),
    [player.inventory],
  );
  const hasUnlockedEquipmentInInventory = useMemo(
    () => player.inventory.some((item) => isEquippableItem(item) && !item.locked),
    [player.inventory],
  );
  const townStock = useMemo(
    () =>
      currentTile.structure === 'town'
        ? buildTownStock(seed, currentTile.coord)
        : [],
    [currentTile.coord, currentTile.structure, seed],
  );
  const gold = useMemo(
    () => getGoldAmount(player.inventory),
    [player.inventory],
  );
  const combatEnemies = useMemo(
    () => (combat ? getEnemiesAt(game, combat.coord) : []),
    [combat, game],
  );
  const currentTileHostileEnemyCount = useMemo(
    () => getHostileEnemyIds(game, currentTile.coord).length,
    [currentTile.coord, game],
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
  const claimStatus = useMemo(() => getCurrentHexClaimStatus(game), [game]);

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
