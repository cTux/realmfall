import { createGame } from '../../../game/state';
import { getReusableVisibleTiles } from '../selectors/getReusableVisibleTiles';

describe('getReusableVisibleTiles', () => {
  it('reuses the previous visibleTiles array for unrelated state clones', () => {
    const game = createGame(3, 'world-render-selectors-stable');
    const initialVisibleTiles = getReusableVisibleTiles([], game);
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

    const nextVisibleTiles = getReusableVisibleTiles(
      initialVisibleTiles,
      logOnlyClone,
    );

    expect(nextVisibleTiles).toBe(initialVisibleTiles);
  });

  it('returns a new visibleTiles array when a visible tile changes', () => {
    const game = createGame(3, 'world-render-selectors-change');
    const initialVisibleTiles = getReusableVisibleTiles([], game);
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

    const nextVisibleTiles = getReusableVisibleTiles(
      initialVisibleTiles,
      changedGame,
    );

    expect(nextVisibleTiles).not.toBe(initialVisibleTiles);
  });
});
