import {
  createGame,
  EQUIPMENT_SLOTS,
  equipItem,
  getEnemyAt,
  getPlayerStats,
  getTileAt,
  getVisibleTiles,
  moveToTile,
  prospectInventory,
  sellAllItems,
  sortInventory,
  type Item,
} from './state';

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
      enemyId: undefined,
    };
    game.player.coord = { q: 1, r: 0 };

    const next = moveToTile(game, target);
    expect(next.player.coord).toEqual(target);
    expect(next.turn).toBe(1);
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
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 8,
        hunger: 12,
      },
    ];

    const sorted = sortInventory(game);
    expect(sorted.player.inventory[0]?.kind).toBe('weapon');
    expect(sorted.player.inventory[1]?.kind).toBe('consumable');

    const sold = sellAllItems(sorted);
    expect(sold.player.gold).toBeGreaterThan(0);
    expect(sold.player.inventory.every((item) => item.kind !== 'weapon')).toBe(
      true,
    );

    const prospected = prospectInventory(sorted);
    expect(
      prospected.player.inventory.some((item) => item.kind === 'resource'),
    ).toBe(true);

    expect(
      prospected.player.inventory.some((item) => item.kind === 'resource'),
    ).toBe(true);
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
