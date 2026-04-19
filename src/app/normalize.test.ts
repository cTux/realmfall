import { normalizeLoadedGame, normalizeSavedUiItem } from './normalize';
import { createGame } from '../game/state';

describe('normalizeLoadedGame', () => {
  it('loads saved game state as-is', () => {
    const game = createGame(3, 'normalize-seed');

    expect(normalizeLoadedGame(game)).toBe(game);
  });

  it('keeps saved ui items as-is', () => {
    const game = createGame(3, 'normalize-ui-item-seed');
    const item = game.player.inventory[0]!;

    expect(normalizeSavedUiItem(item)).toBe(item);
  });
});
