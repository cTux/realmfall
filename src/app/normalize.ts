import type { GameState, Item } from '../game/state';

export function normalizeLoadedGame(game: GameState): GameState {
  return game;
}

export function normalizeSavedUiItem(item: Item) {
  return item;
}
