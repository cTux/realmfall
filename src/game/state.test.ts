import {
  attackCombatEnemy,
  createGame,
  dropInventoryItem,
  EQUIPMENT_SLOTS,
  equipItem,
  getEnemyAt,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getTileAt,
  getVisibleTiles,
  moveToTile,
  prospectInventory,
  sellAllItems,
  sortInventory,
  takeAllTileItems,
  takeTileItem,
  useItem,
  type Item,
} from './state';
import { normalizeLoadedGame } from '../app/normalize';

describe('game state', () => {
  it('creates a centered start in a visible hex viewport', () => {
    const game = createGame(3, 'test-seed');
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
    expect(getTileAt(game, { q: 0, r: 0 }).terrain).toBe('plains');
    expect(getVisibleTiles(game)).toHaveLength(37);
  });

  it('generates deterministic distant tiles for an infinite world', () => {
    const gameA = createGame(3, 'far-seed');
    const gameB = createGame(3, 'far-seed');
    const farCoord = { q: 30, r: -12 };

    expect(getTileAt(gameA, farCoord)).toEqual(getTileAt(gameB, farCoord));
  });

  it('scales enemy level with distance from the origin', () => {
    const game = createGame(3, 'far-seed');
    const near = findEnemy(game, 2, 8);
    const far = findEnemy(game, 28, 36);

    expect(near).toBeDefined();
    expect(far).toBeDefined();
    expect((far?.tier ?? 0) > (near?.tier ?? 0)).toBe(true);
  });

  it('moves onto generated adjacent tiles beyond the starting cache', () => {
    const game = createGame(3, 'loot-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.player.coord = { q: 1, r: 0 };

    const next = moveToTile(game, target);
    expect(next.player.coord).toEqual(target);
    expect(next.turn).toBe(1);
  });

  it('opens and resolves combat encounters on enemy tiles', () => {
    const game = createGame(3, 'combat-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const engaged = moveToTile(game, target);
    expect(engaged.combat).not.toBeNull();

    const resolved = attackCombatEnemy(engaged, 'enemy-2,0-0');
    expect(resolved.combat).toBeNull();
    expect(getEnemiesAt(resolved, target)).toHaveLength(0);
    expect(getTileAt(resolved, target).items).toHaveLength(0);
  });

  it('leaves loot on the tile until the player takes it', () => {
    const game = createGame(3, 'manual-loot-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [
        {
          id: 'resource-gold-1',
          kind: 'resource',
          name: 'Gold',
          quantity: 12,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
    };

    const taken = takeTileItem(game, 'resource-gold-1');

    expect(getGoldAmount(taken.player.inventory)).toBe(12);
    expect(getTileAt(taken, { q: 0, r: 0 }).items).toHaveLength(0);
  });

  it('takes all loot from the current tile at once', () => {
    const game = createGame(3, 'take-all-loot-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [
        {
          id: 'food-1',
          kind: 'consumable',
          name: 'Trail Ration',
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 10,
          hunger: 15,
        },
        {
          id: 'resource-gold-1',
          kind: 'resource',
          name: 'Gold',
          quantity: 7,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
    };

    const taken = takeAllTileItems(game);

    expect(getGoldAmount(taken.player.inventory)).toBe(7);
    expect(
      taken.player.inventory.find((item) => item.name === 'Trail Ration')
        ?.quantity,
    ).toBe(4);
    expect(getTileAt(taken, { q: 0, r: 0 }).items).toHaveLength(0);
  });

  it('can use consumables and drop inventory items onto the ground', () => {
    const game = createGame(3, 'use-drop-seed');
    game.player.hp = 20;

    const used = useItem(game, 'starter-ration');
    expect(used.player.hunger).toBe(100);
    expect(
      used.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);

    const dropped = dropInventoryItem(used, 'starter-ration');
    expect(
      dropped.player.inventory.find((item) => item.id === 'starter-ration'),
    ).toBeUndefined();
    expect(
      getTileAt(dropped, { q: 0, r: 0 }).items.find(
        (item) => item.id === 'starter-ration',
      ),
    ).toBeDefined();
  });

  it('lets every enemy on the tile retaliate during combat', () => {
    const game = createGame(3, 'group-combat-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0', 'enemy-2,0-1'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 2,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-2,0-1'] = {
      id: 'enemy-2,0-1',
      name: 'Bandit',
      coord: target,
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 3,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const engaged = moveToTile(game, target);
    const resolvedRound = attackCombatEnemy(engaged, 'enemy-2,0-0');

    expect(resolvedRound.combat?.enemyIds).toHaveLength(2);
    expect(resolvedRound.player.hp).toBe(27);
  });

  it('caps the log at 100 messages', () => {
    let game = createGame(3, 'log-cap-seed');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      enemyIds: [],
    };

    for (let turn = 0; turn < 120; turn += 1) {
      game = moveToTile(game, turn % 2 === 0 ? { q: 1, r: 0 } : { q: 0, r: 0 });
    }

    expect(game.logs).toHaveLength(100);
    expect(game.logs[0]?.text).toMatch(/you travel to/i);
  });

  it('supports many equipment slots and artifact loadouts', () => {
    const game = createGame(3, 'equip-seed');
    const inventory: Item[] = EQUIPMENT_SLOTS.map((slot, index) => ({
      id: `item-${slot}`,
      kind:
        slot === 'weapon' ? 'weapon' : slot === 'relic' ? 'artifact' : 'armor',
      slot,
      name: `Item ${index}`,
      quantity: 1,
      tier: 2,
      rarity: 'rare',
      power: slot === 'weapon' || slot === 'relic' ? 3 : 0,
      defense: slot === 'weapon' ? 0 : 2,
      maxHp: 1,
      healing: 0,
      hunger: 0,
    }));

    game.player.inventory = inventory;
    const equipped = inventory.reduce(
      (current, item) => equipItem(current, item.id),
      game,
    );

    expect(Object.keys(equipped.player.equipment)).toHaveLength(
      EQUIPMENT_SLOTS.length,
    );
    expect(getPlayerStats(equipped.player).defense).toBeGreaterThan(
      getPlayerStats(game.player).defense,
    );
  });

  it('sorts, prospects, and sells inventory into gold/resources', () => {
    const game = createGame(3, 'trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
        kind: 'weapon',
        slot: 'weapon',
        name: 'Rust Blade',
        quantity: 1,
        tier: 2,
        rarity: 'common',
        power: 4,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'food-1',
        kind: 'consumable',
        name: 'Trail Ration',
        quantity: 2,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 8,
        hunger: 12,
      },
    ];
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'forge' };

    const sorted = sortInventory(game);
    expect(sorted.player.inventory[0]?.kind).toBe('weapon');
    expect(sorted.player.inventory[1]?.kind).toBe('consumable');

    const sold = sellAllItems(sorted);
    expect(sold.logs[0]?.text).toMatch(/only while standing in town/i);

    const prospected = prospectInventory(sorted);
    expect(
      prospected.player.inventory.some((item) => item.kind === 'resource'),
    ).toBe(true);

    expect(
      prospected.player.inventory.some((item) => item.kind === 'resource'),
    ).toBe(true);

    sorted.tiles['0,0'] = { ...sorted.tiles['0,0'], structure: 'town' };
    const soldInTown = sellAllItems(sorted);
    expect(getGoldAmount(soldInTown.player.inventory)).toBeGreaterThan(0);
  });

  it('merges duplicate gold stacks when sorting inventory', () => {
    const game = createGame(3, 'gold-sort-seed');
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        kind: 'resource',
        name: 'Gold',
        quantity: 5,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'resource-gold-1-copy',
        kind: 'resource',
        name: 'Gold',
        quantity: 7,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const sorted = sortInventory(game);

    expect(getGoldAmount(sorted.player.inventory)).toBe(12);
    expect(
      sorted.player.inventory.filter(
        (item) => item.kind === 'resource' && item.name === 'Gold',
      ),
    ).toHaveLength(1);
  });

  it('does not duplicate gold when loading migrated saves', () => {
    const game = createGame(3, 'gold-load-seed');
    const loaded = normalizeLoadedGame({
      ...game,
      player: {
        ...game.player,
        inventory: [
          {
            id: 'resource-gold-1',
            kind: 'resource',
            name: 'Gold',
            quantity: 11,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
        ],
        gold: 11,
      } as typeof game.player & { gold: number },
    });

    expect(getGoldAmount(loaded.player.inventory)).toBe(11);
    expect(
      loaded.player.inventory.filter(
        (item) => item.kind === 'resource' && item.name === 'Gold',
      ),
    ).toHaveLength(1);
    expect('gold' in loaded.player).toBe(false);
  });
});

function findEnemy(
  game: ReturnType<typeof createGame>,
  min: number,
  max: number,
) {
  for (let q = -max; q <= max; q += 1) {
    for (let r = -max; r <= max; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance < min || distance > max) continue;
      const enemy = getEnemyAt(game, { q, r });
      if (enemy) return enemy;
    }
  }

  return undefined;
}
