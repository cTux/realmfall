import { createGame } from '../../../game/stateFactory';
import { getVisibleTiles } from '../../../game/stateSelectors';
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

  it('returns a new visibleTiles array when the player position changes', () => {
    const game = createGame(3, 'world-render-selectors-player-move');
    const initialVisibleTiles = reuseVisibleTilesIfUnchanged([], game);
    const movedGame = {
      ...game,
      player: {
        ...game.player,
        coord: { q: 1, r: 0 },
      },
    };

    const nextVisibleTiles = reuseVisibleTilesIfUnchanged(
      initialVisibleTiles,
      movedGame,
    );

    expect(nextVisibleTiles).not.toBe(initialVisibleTiles);
  });

  it('persists metadata when reusing a caller-seeded visibleTiles array', () => {
    const game = createGame(3, 'world-render-selectors-caller-seeded');
    const callerSeededVisibleTiles = getVisibleTiles(game);
    const logOnlyClone = {
      ...game,
      logs: [
        ...game.logs,
        {
          id: 'log-1',
          kind: 'system' as const,
          text: 'Mist hangs over the ridge.',
          turn: game.turn,
        },
      ],
    };
    const offscreenEnemyClone = {
      ...logOnlyClone,
      enemies: {
        ...logOnlyClone.enemies,
        'enemy-5,0-0': {
          id: 'enemy-5,0-0',
          name: 'Wolf',
          coord: { q: 5, r: 0 },
          tier: 1,
          hp: 1,
          maxHp: 1,
          attack: 1,
          defense: 0,
          xp: 1,
          elite: false,
        },
      },
    };

    const reusedVisibleTiles = reuseVisibleTilesIfUnchanged(
      callerSeededVisibleTiles,
      logOnlyClone,
    );
    const nextVisibleTiles = reuseVisibleTilesIfUnchanged(
      reusedVisibleTiles,
      offscreenEnemyClone,
    );

    expect(reusedVisibleTiles).toBe(callerSeededVisibleTiles);
    expect(nextVisibleTiles).toBe(callerSeededVisibleTiles);
  });
});
