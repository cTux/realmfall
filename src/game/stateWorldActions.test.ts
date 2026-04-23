import {
  claimCurrentHex,
  createGame,
  getTileAt,
  getVisibleTiles,
  healAtFactionNpc,
  interactWithStructure,
  setHomeHex,
} from './state';
import { t } from '../i18n';
import { StatusEffectTypeId } from './content/ids';
import { makeGoldStack } from './inventory';
import { buildTile } from './world';
import { getStructureConfig } from './content/structures';
import { hexDistance, hexKey, hexNeighbors } from './hex';
import { Skill, type GameState } from './types';
import {
  createGeneratedWorldBossEncounter,
  createPlacedWorldBossEncounter,
} from './stateTestHelpers';

describe('game state world actions', () => {
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

  it('gathers from structures, grants resources, and levels the matching skill', () => {
    const game = createGame(3, 'gather-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'tree',
      structureHp: 2,
      structureMaxHp: 2,
      items: [],
      enemyIds: [],
    };

    const chopped = interactWithStructure(game);

    expect(chopped.player.inventory.some((item) => item.name === 'Logs')).toBe(
      true,
    );
    expect(chopped.player.skills[Skill.Logging].xp).toBeGreaterThan(0);
    expect(getTileAt(chopped, { q: 0, r: 0 }).structureHp).toBe(1);

    const cleared = interactWithStructure(chopped);
    expect(getTileAt(cleared, { q: 0, r: 0 }).structure).toBeUndefined();
  });

  it('uses skill level as the extra gathering loot chance', () => {
    const game = createGame(3, 'gather-bonus-seed');
    game.player.skills[Skill.Logging].level = 100;
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'tree',
      structureHp: 5,
      structureMaxHp: 5,
      items: [],
      enemyIds: [],
    };

    const gathered = interactWithStructure(game);
    const logs = gathered.player.inventory.find((item) => item.name === 'Logs');

    expect(logs?.quantity).toBe(27);
    expect(gathered.logs.some((entry) => /extra logs/i.test(entry.text))).toBe(
      true,
    );
  });

  it('gathers herbs from herb patches', () => {
    const game = createGame(3, 'herb-patch-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'herbs',
      structureHp: 1,
      structureMaxHp: 1,
      items: [],
      enemyIds: [],
    };

    const gathered = interactWithStructure(game);

    expect(
      gathered.player.inventory.some((item) =>
        [
          'Herbs',
          'Beet',
          'Pepper',
          'Cabbage',
          'Carrot',
          'Cherry',
          'Garlic',
          'Leek',
          'Lemon',
          'Peas',
          'Tomato',
          'Aubergine',
          'Apple',
        ].includes(item.name),
      ),
    ).toBe(true);
    expect(gathered.player.skills[Skill.Gathering].xp).toBeGreaterThan(0);
    expect(getTileAt(gathered, { q: 0, r: 0 }).structure).toBeUndefined();
  });

  it('uses canonical reward item keys even when structure reward labels change', () => {
    const game = createGame(3, 'localized-gather-reward-seed');
    const treeConfig = getStructureConfig('tree');
    const gathering = treeConfig.gathering;
    if (!gathering) {
      throw new Error('Expected tree gathering config');
    }

    const originalReward = gathering.reward;
    gathering.reward = 'Bosque antiguo';

    try {
      game.tiles['0,0'] = {
        ...game.tiles['0,0'],
        structure: 'tree',
        structureHp: 1,
        structureMaxHp: 1,
        items: [],
        enemyIds: [],
      };

      const gathered = interactWithStructure(game);
      const logs = gathered.player.inventory.find(
        (item) => item.itemKey === 'logs',
      );

      expect(logs).toBeDefined();
      expect(logs?.name).toBe('Logs');
    } finally {
      gathering.reward = originalReward;
    }
  });

  it('can gather sticks from logging and stone from mining byproducts', () => {
    let sticksFound = false;
    let stoneFound = false;

    for (
      let index = 0;
      index < 300 && (!sticksFound || !stoneFound);
      index += 1
    ) {
      const treeGame = createGame(3, `tree-byproduct-${index}`);
      treeGame.tiles['0,0'] = {
        ...treeGame.tiles['0,0'],
        structure: 'tree',
        structureHp: 5,
        structureMaxHp: 5,
        items: [],
        enemyIds: [],
      };
      const chopped = interactWithStructure(treeGame);
      sticksFound ||= chopped.player.inventory.some(
        (item) => item.name === 'Sticks',
      );

      const oreGame = createGame(3, `ore-byproduct-${index}`);
      oreGame.tiles['0,0'] = {
        ...oreGame.tiles['0,0'],
        structure: 'copper-ore',
        structureHp: 6,
        structureMaxHp: 6,
        items: [],
        enemyIds: [],
      };
      const mined = interactWithStructure(oreGame);
      stoneFound ||= mined.player.inventory.some(
        (item) => item.name === 'Stone',
      );
    }

    expect(sticksFound).toBe(true);
    expect(stoneFound).toBe(true);
  });

  it('sets home on an empty hex', () => {
    const game = createGame(3, 'set-home-empty-seed');
    game.player.coord = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };

    const next = setHomeHex(game);
    const homeTile = getTileAt(next, { q: 1, r: 0 });

    expect(next.homeHex).toEqual({ q: 1, r: 0 });
    expect(homeTile.structure).toBeUndefined();
    expect(homeTile.items).toEqual([]);
    expect(homeTile.enemyIds).toEqual([]);
  });

  it('prevents setting home on another territory', () => {
    const game = createGame(3, 'set-home-claimed-seed');
    game.player.coord = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'resource-gold-home',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 4,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
      structure: 'camp',
      enemyIds: ['enemy-1,0-0'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const next = setHomeHex(game);
    const blockedTile = getTileAt(next, { q: 1, r: 0 });

    expect(next.homeHex).toEqual(game.homeHex);
    expect(blockedTile).toMatchObject({
      terrain: 'plains',
      structure: 'camp',
      items: [
        {
          id: 'resource-gold-home',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 4,
        },
      ],
      enemyIds: ['enemy-1,0-0'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
      },
    });
    expect(next.enemies['enemy-1,0-0']).toBeDefined();
    expect(
      next.logs.some((entry) =>
        entry.text.includes(t('game.message.home.blockedByTerritory')),
      ),
    ).toBe(true);
  });

  it('prevents setting home on a non-empty hex', () => {
    const game = createGame(3, 'set-home-occupied-seed');
    game.player.coord = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'resource-gold-home-occupied',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
      structure: undefined,
      enemyIds: [],
    };

    const next = setHomeHex(game);

    expect(next.homeHex).toEqual(game.homeHex);
    expect(getTileAt(next, { q: 1, r: 0 })).toMatchObject({
      items: [
        {
          id: 'resource-gold-home-occupied',
          quantity: 2,
        },
      ],
      structure: undefined,
      enemyIds: [],
    });
    expect(
      next.logs.some((entry) =>
        entry.text.includes(t('game.message.home.blockedByOccupied')),
      ),
    ).toBe(true);
  });

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
  });

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

function addBannerMaterials(
  game: GameState,
  quantity: number,
  idPrefix: string,
) {
  game.player.inventory.push(
    {
      id: `${idPrefix}-cloth`,
      itemKey: 'cloth',
      name: 'Cloth',
      quantity,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    },
    {
      id: `${idPrefix}-sticks`,
      itemKey: 'sticks',
      name: 'Sticks',
      quantity,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    },
  );
}
