import { createSelector } from '@reduxjs/toolkit';
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
} from '../../../game/state';
import { t } from '../../../i18n';
import type { RootState } from '../store';

export const selectGame = (state: RootState) => state.game;
export const selectPlayer = (state: RootState) => state.game.player;
export const selectCombat = (state: RootState) => state.game.combat;
export const selectGameWorldTimeMs = (state: RootState) =>
  state.game.worldTimeMs;
export const selectPlayerInventory = (state: RootState) =>
  state.game.player.inventory;
export const selectPlayerEquipment = (state: RootState) =>
  state.game.player.equipment;

export const selectCurrentTile = createSelector(selectGame, getCurrentTile);
export const selectPlayerStats = createSelector(selectPlayer, getPlayerStats);
export const selectRecipeBookKnown = createSelector(selectPlayer, (player) =>
  hasRecipeBook(player.inventory),
);
export const selectRecipes = createSelector(selectPlayer, (player) =>
  getRecipeBookRecipes(player.learnedRecipeIds),
);
export const selectInventoryCounts = createSelector(selectPlayer, (player) =>
  player.inventory.reduce<Record<string, number>>((counts, item) => {
    counts[item.name] = (counts[item.name] ?? 0) + item.quantity;
    return counts;
  }, {}),
);
export const selectHasEquippableItems = createSelector(
  selectGame,
  hasEquippableInventoryItems,
);
export const selectTownStock = createSelector(selectGame, getTownStock);
export const selectGold = createSelector(selectPlayer, (player) =>
  getGoldAmount(player.inventory),
);
export const selectCombatEnemies = createSelector(selectGame, (game) =>
  game.combat ? getEnemiesAt(game, game.combat.coord) : [],
);
export const selectClaimStatus = createSelector(
  selectGame,
  getCurrentHexClaimStatus,
);
export const selectInteractLabel = createSelector(selectCurrentTile, (tile) =>
  structureActionLabel(tile.structure),
);
export const selectCanProspect = createSelector(
  selectCurrentTile,
  selectHasEquippableItems,
  (tile, hasEquippableItems) =>
    tile.structure === 'forge' && hasEquippableItems,
);
export const selectCanSell = createSelector(
  selectCurrentTile,
  selectHasEquippableItems,
  (tile, hasEquippableItems) => tile.structure === 'town' && hasEquippableItems,
);
export const selectProspectExplanation = createSelector(
  selectCurrentTile,
  selectHasEquippableItems,
  (tile, hasEquippableItems) =>
    tile.structure === 'forge' && !hasEquippableItems
      ? t('game.message.prospect.empty')
      : null,
);
export const selectSellExplanation = createSelector(
  selectCurrentTile,
  selectHasEquippableItems,
  (tile, hasEquippableItems) =>
    tile.structure === 'town' && !hasEquippableItems
      ? t('game.message.sell.empty')
      : null,
);
