import { createGame } from '../../../game/state';
import { reuseVisibleTilesIfUnchanged } from '../selectors/reuseVisibleTilesIfUnchanged';

describe('reuseVisibleTilesIfUnchanged', () => {
  it('reuses the previous visibleTiles array for unrelated state clones', () => {
    const game = createGame(3, 'world-render-selectors-stable');
    const initialVisibleTiles = reuseVisibleTilesIfUnchanged([], game);
    const logOnlyClone = {
      ...game,
      logs: [
        ...game.logs,
        {
          id: 'log-1',
          kind: 'system' as const,
          text: 'A steady breeze moves through the valley.',
          turn: game.turn,
        },
      ],
    };

    const nextVisibleTiles = reuseVisibleTilesIfUnchanged(
      initialVisibleTiles,
      logOnlyClone,
    );

    expect(nextVisibleTiles).toBe(initialVisibleTiles);
  });

  it('returns a new visibleTiles array when a visible tile changes', () => {
    const game = createGame(3, 'world-render-selectors-change');
    const initialVisibleTiles = reuseVisibleTilesIfUnchanged([], game);
    const changedGame = {
      ...game,
      tiles: {
        ...game.tiles,
        '1,0': {
          ...game.tiles['1,0'],
          structure: 'camp' as const,
        },
      },
    };

    const nextVisibleTiles = reuseVisibleTilesIfUnchanged(
      initialVisibleTiles,
      changedGame,
    );

    expect(nextVisibleTiles).not.toBe(initialVisibleTiles);
  });
});
