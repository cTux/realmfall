import { WORLD_REVEAL_RADIUS } from './config';
import {
  buildOutpostAtCurrentHex,
  claimCurrentHex,
  createGame,
  getSafePathToTile,
  getTileAt,
} from './state';
import {
  addBannerMaterials,
  addResourceItems,
} from './stateWorldActionsTestHelpers';

describe('game state outposts', () => {
  it('builds a watchtower on a claimed hex by consuming the required materials', () => {
    let game = createGame(6, 'watchtower-build-seed');
    addBannerMaterials(game, 1, 'watchtower-claim');
    game = claimCurrentHex(game);
    addResourceItems(
      game,
      [
        { itemKey: 'logs', quantity: 3 },
        { itemKey: 'stone', quantity: 2 },
        { itemKey: 'cloth', quantity: 1 },
      ],
      'watchtower-build',
    );

    const built = buildOutpostAtCurrentHex(game, 'watchtower');

    expect(getTileAt(built, { q: 0, r: 0 })).toMatchObject({
      claim: { ownerType: 'player' },
      structure: 'watchtower',
    });
    expect(
      built.player.inventory.some(
        (item) =>
          item.itemKey != null &&
          ['logs', 'stone', 'cloth'].includes(item.itemKey),
      ),
    ).toBe(false);
    expect(built.logs.some((entry) => /watchtower/i.test(entry.text))).toBe(
      true,
    );
  });

  it('blocks unclaiming a player watchtower hex until outpost removal exists', () => {
    let game = createGame(6, 'watchtower-claim-block-seed');
    addBannerMaterials(game, 1, 'watchtower-claim-block');
    game = claimCurrentHex(game);
    addResourceItems(
      game,
      [
        { itemKey: 'logs', quantity: 3 },
        { itemKey: 'stone', quantity: 2 },
        { itemKey: 'cloth', quantity: 1 },
      ],
      'watchtower-claim-block',
    );
    game = buildOutpostAtCurrentHex(game, 'watchtower');

    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, { q: 0, r: 0 })).toMatchObject({
      claim: { ownerType: 'player' },
      structure: 'watchtower',
    });
    expect(blocked.logs.some((entry) => /outpost/i.test(entry.text))).toBe(
      true,
    );
  });

  it('extends safe-path scouting beyond the base reveal radius while the player is inside watchtower range', () => {
    let game = createGame(WORLD_REVEAL_RADIUS + 3, 'watchtower-scout-seed');
    addBannerMaterials(game, 1, 'watchtower-scout-claim');
    game = claimCurrentHex(game);
    addResourceItems(
      game,
      [
        { itemKey: 'logs', quantity: 3 },
        { itemKey: 'stone', quantity: 2 },
        { itemKey: 'cloth', quantity: 1 },
      ],
      'watchtower-scout-build',
    );
    game = buildOutpostAtCurrentHex(game, 'watchtower');

    for (let q = 1; q <= WORLD_REVEAL_RADIUS + 1; q += 1) {
      game.tiles[`${q},0`] = {
        coord: { q, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      };
    }

    expect(
      getSafePathToTile(game, { q: WORLD_REVEAL_RADIUS + 1, r: 0 }),
    ).toEqual(
      Array.from({ length: WORLD_REVEAL_RADIUS + 1 }, (_unused, index) => ({
        q: index + 1,
        r: 0,
      })),
    );
  });
});
