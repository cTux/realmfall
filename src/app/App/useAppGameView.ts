import { useMemo } from 'react';
import {
  getCurrentHexClaimStatus,
  getCurrentTile,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getRecipeBookRecipes,
  getTownStock,
  hasEquippableInventoryItems,
  hasRecipeBook,
  structureActionLabel,
  type GameState,
  type LogKind,
} from '../../game/state';
import { t } from '../../i18n';

interface UseAppGameViewOptions {
  game: GameState;
  logFilters: Record<LogKind, boolean>;
}

export function useAppGameView({ game, logFilters }: UseAppGameViewOptions) {
  const stats = useMemo(() => getPlayerStats(game.player), [game.player]);
  const currentTile = useMemo(() => getCurrentTile(game), [game]);
  const recipeBookKnown = useMemo(
    () => hasRecipeBook(game.player.inventory),
    [game.player.inventory],
  );
  const recipes = useMemo(
    () => getRecipeBookRecipes(game.player.learnedRecipeIds),
    [game.player.learnedRecipeIds],
  );
  const inventoryCounts = useMemo(
    () =>
      game.player.inventory.reduce<Record<string, number>>((counts, item) => {
        counts[item.name] = (counts[item.name] ?? 0) + item.quantity;
        return counts;
      }, {}),
    [game.player.inventory],
  );
  const hasEquippableItems = useMemo(
    () => hasEquippableInventoryItems(game),
    [game],
  );
  const townStock = useMemo(() => getTownStock(game), [game]);
  const gold = useMemo(
    () => getGoldAmount(game.player.inventory),
    [game.player.inventory],
  );
  const combatEnemies = useMemo(
    () => (game.combat ? getEnemiesAt(game, game.combat.coord) : []),
    [game],
  );
  const filteredLogs = useMemo(
    () => game.logs.filter((entry) => logFilters[entry.kind]),
    [game.logs, logFilters],
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
    inventoryCounts,
    prospectExplanation,
    recipeBookKnown,
    recipes,
    sellExplanation,
    stats,
    townStock,
  };
}
