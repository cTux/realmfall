import { claimCurrentHex, createGame, getTileAt } from './state';
import { addBannerMaterials } from './stateWorldActionsTestHelpers';

describe('game state world claims', () => {
  it('claims an empty passable hex by consuming cloth and sticks', () => {
    const game = createGame(3, 'claim-hex-seed');
    addBannerMaterials(game, 1, 'claim-hex');

    const claimed = claimCurrentHex(game);

    expect(getTileAt(claimed, { q: 0, r: 0 }).claim).toMatchObject({
      ownerType: 'player',
      ownerId: 'player-territory',
    });
    expect(
      claimed.player.inventory.some((item) => item.itemKey === 'cloth'),
    ).toBe(false);
    expect(
      claimed.player.inventory.some((item) => item.itemKey === 'sticks'),
    ).toBe(false);
  });

  it('requires new claims to connect to the existing player territory', () => {
    let game = createGame(4, 'claim-connect-seed');
    addBannerMaterials(game, 2, 'claim-connect');
    game = claimCurrentHex(game);
    game.player.coord = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      claim: undefined,
    };

    const denied = claimCurrentHex(game);

    expect(getTileAt(denied, { q: 2, r: 0 }).claim).toBeUndefined();
    expect(
      denied.logs.some((entry) =>
        /must connect to your existing border/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('limits the player territory to 5 claimed hexes', () => {
    let game = createGame(6, 'claim-limit-seed');
    addBannerMaterials(game, 6, 'claim-limit');

    for (const coord of [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 3, r: 0 },
      { q: 4, r: 0 },
    ]) {
      game.player.coord = coord;
      game.tiles[`${coord.q},${coord.r}`] = {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
        claim: game.tiles[`${coord.q},${coord.r}`]?.claim,
      };
      game = claimCurrentHex(game);
    }

    game.player.coord = { q: 5, r: 0 };
    game.tiles['5,0'] = {
      coord: { q: 5, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      claim: undefined,
    };

    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, { q: 5, r: 0 }).claim).toBeUndefined();
    expect(
      blocked.logs.some((entry) => /claim up to 5 hexes/i.test(entry.text)),
    ).toBe(true);
  });

  it('allows unclaiming a player hex when the remaining territory stays connected', () => {
    let game = createGame(4, 'claim-unclaim-leaf-seed');
    addBannerMaterials(game, 2, 'claim-unclaim-leaf');

    for (const coord of [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
    ]) {
      game.player.coord = coord;
      game.tiles[`${coord.q},${coord.r}`] = {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
        claim: game.tiles[`${coord.q},${coord.r}`]?.claim,
      };
      game = claimCurrentHex(game);
    }

    game.player.coord = { q: 1, r: 0 };
    const unclaimed = claimCurrentHex(game);

    expect(getTileAt(unclaimed, { q: 1, r: 0 }).claim).toBeUndefined();
    expect(getTileAt(unclaimed, { q: 0, r: 0 }).claim?.ownerType).toBe(
      'player',
    );
    expect(
      unclaimed.logs.some((entry) =>
        /unclaim the hex at 1, 0/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('blocks unclaiming a player hex when it would split the territory', () => {
    let game = createGame(5, 'claim-unclaim-split-seed');
    addBannerMaterials(game, 3, 'claim-unclaim-split');

    for (const coord of [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]) {
      game.player.coord = coord;
      game.tiles[`${coord.q},${coord.r}`] = {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
        claim: game.tiles[`${coord.q},${coord.r}`]?.claim,
      };
      game = claimCurrentHex(game);
    }

    game.player.coord = { q: 1, r: 0 };
    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, { q: 1, r: 0 }).claim?.ownerType).toBe('player');
    expect(
      blocked.logs.some((entry) =>
        /would split your territory/i.test(entry.text),
      ),
    ).toBe(true);
  });
});
