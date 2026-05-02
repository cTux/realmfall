import { createGame } from './state';
import { makePlayerClaim } from './territories';
import { getPlayerClaimedTiles, getResolvedTileAt } from './stateWorldQueries';

describe('stateWorldQueries', () => {
  it('reuses claimed-tile scans while the tiles container is unchanged', () => {
    const game = createGame(3, 'claimed-tiles-cache-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: makePlayerClaim(),
    };

    const firstLookup = getPlayerClaimedTiles(game);
    const secondLookup = getPlayerClaimedTiles({ tiles: game.tiles });

    expect(secondLookup).toBe(firstLookup);
    expect(secondLookup).toHaveLength(1);
  });

  it('rebuilds the claimed-tile list when the tiles container changes', () => {
    const game = createGame(3, 'claimed-tiles-cache-refresh-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: makePlayerClaim(),
    };

    const firstLookup = getPlayerClaimedTiles(game);
    const nextTiles = {
      ...game.tiles,
      '1,0': {
        ...game.tiles['1,0'],
        claim: makePlayerClaim(),
      },
    };

    const secondLookup = getPlayerClaimedTiles({ tiles: nextTiles });

    expect(secondLookup).not.toBe(firstLookup);
    expect(secondLookup).toHaveLength(2);
  });

  it('returns null for unresolved coordinates without generating a tile', () => {
    const game = createGame(3, 'resolved-tile-only-query');

    expect(getResolvedTileAt(game, { q: 6, r: -3 })).toBeNull();
    expect(game.tiles['6,-3']).toBeUndefined();
  });
});
