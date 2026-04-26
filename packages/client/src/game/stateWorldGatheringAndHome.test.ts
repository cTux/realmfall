import { t } from '../i18n';
import {
  createGame,
  getTileAt,
  interactWithStructure,
  setHomeHex,
} from './state';
import { getStructureConfig } from './content/structures';
import { Skill } from './types';

describe('game state world gathering and home', () => {
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
});
