import { t } from '../i18n';
import { StatusEffectTypeId } from './content/ids';
import { hexDistance, hexKey, hexNeighbors } from './hex';
import { makeGoldStack } from './inventory';
import {
  claimCurrentHex,
  createGame,
  getTileAt,
  getVisibleTiles,
  healAtFactionNpc,
} from './state';
import {
  createGeneratedWorldBossEncounter,
  createPlacedWorldBossEncounter,
} from './stateTestHelpers';
import { buildTile } from './world';
import { addBannerMaterials } from './stateWorldActionsTestHelpers';

describe.skip('game state world boss and faction actions', () => {
  it('treats non-center world boss footprint hexes as occupied until the boss dies', () => {
    const { game, center, bossId } = createPlacedWorldBossEncounter();
    const footprintHex = getVisibleTiles({
      ...game,
      player: { ...game.player, coord: center },
    }).find((tile) => hexDistance(tile.coord, center) === 1)?.coord;

    expect(footprintHex).toBeDefined();

    game.player.coord = footprintHex!;
    addBannerMaterials(game, 1, 'footprint-claim');

    const blocked = claimCurrentHex(game);
    expect(getTileAt(blocked, footprintHex!).claim).toBeUndefined();
    expect(blocked.logs[0]?.text).toContain(
      t('game.message.claim.status.emptyOnly'),
    );

    delete game.enemies[bossId];
    game.tiles[`${center.q},${center.r}`] = {
      ...getTileAt(game, center),
      enemyIds: [],
    };

    const claimed = claimCurrentHex(game);
    expect(getTileAt(claimed, footprintHex!).claim?.ownerType).toBe('player');
  });

  it('reserves generated boss footprint hexes even before the center tile is loaded', () => {
    const { game, center } = createGeneratedWorldBossEncounter();
    const footprintHex =
      hexNeighbors(center).find((coord) => {
        const tile = buildTile(game.seed, coord);
        return tile.terrain !== 'rift' && tile.terrain !== 'mountain';
      }) ?? hexNeighbors(center)[0]!;

    game.player.coord = footprintHex;
    game.tiles[hexKey(footprintHex)] = buildTile(game.seed, footprintHex);
    delete game.tiles[hexKey(center)];
    addBannerMaterials(game, 1, 'generated-footprint-claim');

    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, footprintHex).claim).toBeUndefined();
    expect(blocked.logs[0]?.text).toContain(
      t('game.message.claim.status.emptyOnly'),
    );
  }, 15_000);

  it('lets a faction NPC heal the player for 1 gold while preserving hunger and thirst', () => {
    const game = createGame(3, 'faction-heal-seed');
    game.player.inventory.push(makeGoldStack(3));
    game.player.hp = 1;
    game.player.statusEffects = [
      { id: StatusEffectTypeId.Bleeding, value: 4 },
      { id: StatusEffectTypeId.Hunger, value: 10 },
      { id: StatusEffectTypeId.Thirst, value: 10 },
      { id: StatusEffectTypeId.Restoration, value: 5 },
      { id: StatusEffectTypeId.RecentDeath, value: 10 },
    ];
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
        npc: { name: 'Araken' },
      },
    };

    const healed = healAtFactionNpc(game);

    expect(healed.player.hp).toBeGreaterThan(game.player.hp);
    expect(
      healed.player.inventory.find((item) => item.itemKey === 'gold')?.quantity,
    ).toBe(2);
    expect(healed.player.statusEffects.map((effect) => effect.id)).toEqual([
      StatusEffectTypeId.Hunger,
      StatusEffectTypeId.Thirst,
      StatusEffectTypeId.Restoration,
    ]);
    expect(healed.logs[0]?.text).toContain('Araken');
  });
});
