import { useMemo } from 'react';
import {
  getCurrentHexClaimStatus,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getRecipeBookEntries,
  structureActionLabel,
  type GameState,
  type LogKind,
} from '../../game/state';
import { buildTownStock } from '../../game/economy';
import { hexKey } from '../../game/hex';
import { isEquippableItem } from '../../game/inventory';
import { buildTile } from '../../game/world';
import { t } from '../../i18n';

interface UseAppGameViewOptions {
  game: GameState;
  logFilters: Record<LogKind, boolean>;
}

export function useAppGameView({ game, logFilters }: UseAppGameViewOptions) {
  const { combat, logs, player, seed, tiles } = game;

  const stats = useMemo(() => getPlayerStats(player), [player]);
  const currentTile = useMemo(
    () => tiles[hexKey(player.coord)] ?? buildTile(seed, player.coord),
    [player.coord, seed, tiles],
  );
  const recipes = useMemo(
    () => getRecipeBookEntries(player.learnedRecipeIds),
    [player.learnedRecipeIds],
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
  const hasEquippableItems = useMemo(
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
  const filteredLogs = useMemo(
    () => logs.filter((entry) => logFilters[entry.kind]),
    [logFilters, logs],
  );

  const canProspect = currentTile.structure === 'forge' && hasEquippableItems;
  const canSell = currentTile.structure === 'town' && hasEquippableItems;
  const prospectExplanation =
    currentTile.structure === 'forge' && !hasEquippableItems
      ? t('game.message.prospect.empty')
      : null;
  const sellExplanation =
    currentTile.structure === 'town' && !hasEquippableItems
      ? t('game.message.sell.empty')
      : null;
  const interactLabel = structureActionLabel(currentTile.structure);
  const claimStatus = useMemo(() => getCurrentHexClaimStatus(game), [game]);

  return {
    claimStatus,
    canProspect,
    canSell,
    combatEnemies,
    currentTile,
    filteredLogs,
    gold,
    interactLabel,
    inventoryCountsByItemKey,
    prospectExplanation,
    recipes,
    sellExplanation,
    stats,
    townStock,
  };
}
