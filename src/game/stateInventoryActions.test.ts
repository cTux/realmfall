import {
  buyTownItem,
  createGame,
  getGoldAmount,
  getTileAt,
  getTownStock,
  moveToTile,
  prospectInventory,
  prospectInventoryItem,
  sellAllItems,
  sellInventoryItem,
  setInventoryItemLocked,
  sortInventory,
  startCombat,
  takeAllTileItems,
  takeTileItem,
} from './state';
import { GAME_DAY_DURATION_MS } from './config';
import { getItemCategory } from './content/items';

describe('game state inventory actions', () => {
  it('keeps dungeon structures after tile loot is taken', () => {
    const game = createGame(3, 'loot-structure-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'forest',
      structure: 'dungeon',
      items: [
        {
          id: 'resource-gold-1',
          name: 'Gold',
          itemKey: 'gold',
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
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Raider',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: true,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const clearedCombat = startCombat(encountered);
    expect(getTileAt(clearedCombat, target).structure).toBe('dungeon');

    const looted = takeAllTileItems(clearedCombat);
    expect(getTileAt(looted, target).structure).toBeUndefined();
  });

  it('lets the player buy items from town stock', () => {
    const game = createGame(3, 'town-stock-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'town' };
    game.player.inventory.push({
      id: 'resource-gold-1',
      name: 'Gold',
      itemKey: 'gold',
      quantity: 500,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const stock = getTownStock(game);
    const bought = buyTownItem(game, stock[0].item.id);
    const remainingStock = getTownStock(bought);

    expect(stock.length).toBeGreaterThanOrEqual(30);
    expect(stock.every((entry) => entry.item.slot)).toBe(true);
    expect(
      bought.player.inventory.some((item) => item.name === stock[0].item.name),
    ).toBe(true);
    expect(getGoldAmount(bought.player.inventory)).toBeLessThan(500);
    expect(remainingStock).toHaveLength(stock.length - 1);
    expect(
      remainingStock.some((entry) => entry.item.id === stock[0]?.item.id),
    ).toBe(false);
  });

  it('leaves loot on the tile until the player takes it', () => {
    const game = createGame(3, 'manual-loot-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [
        {
          id: 'resource-gold-1',
          name: 'Gold',
          itemKey: 'gold',
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
          name: 'Trail Ration',
          itemKey: 'trail-ration',
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
          name: 'Gold',
          itemKey: 'gold',
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

  it('sorts, prospects, and sells inventory into gold and resources', () => {
    const game = createGame(3, 'trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
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
        name: 'Trail Ration',
        itemKey: 'trail-ration',
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
    expect(getItemCategory(sorted.player.inventory[0]!)).toBe('weapon');
    expect(getItemCategory(sorted.player.inventory[1]!)).toBe('consumable');

    const sold = sellAllItems(sorted);
    expect(sold.logs[0]?.text).toMatch(/only while standing in town/i);

    const prospected = prospectInventory(sorted);
    expect(
      prospected.player.inventory.some(
        (item) => getItemCategory(item) === 'resource',
      ),
    ).toBe(true);

    sorted.tiles['0,0'] = { ...sorted.tiles['0,0'], structure: 'town' };
    const soldInTown = sellAllItems(sorted);
    expect(getGoldAmount(soldInTown.player.inventory)).toBeGreaterThan(0);
  });

  it('keeps locked equippable items out of prospecting and selling', () => {
    const game = createGame(3, 'locked-trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
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
        id: 'weapon-2',
        slot: 'weapon',
        name: 'Spare Blade',
        quantity: 1,
        tier: 2,
        rarity: 'common',
        power: 3,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const locked = setInventoryItemLocked(game, 'weapon-1', true);
    locked.tiles['0,0'] = { ...locked.tiles['0,0'], structure: 'forge' };

    const prospected = prospectInventory(locked);
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-1'),
    ).toBe(true);
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-2'),
    ).toBe(false);

    prospected.tiles['0,0'] = { ...prospected.tiles['0,0'], structure: 'town' };
    const sold = sellAllItems(prospected);
    expect(sold.player.inventory.some((item) => item.id === 'weapon-1')).toBe(
      true,
    );
  });

  it('prospects and sells a single inventory item from the current hex', () => {
    const game = createGame(3, 'single-trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
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
        id: 'weapon-2',
        slot: 'weapon',
        name: 'Spare Blade',
        quantity: 1,
        tier: 2,
        rarity: 'common',
        power: 3,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'forge' };
    const prospected = prospectInventoryItem(game, 'weapon-1');
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-1'),
    ).toBe(false);
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-2'),
    ).toBe(true);
    expect(
      prospected.player.inventory.some((item) => item.itemKey === 'iron-ore'),
    ).toBe(true);

    prospected.tiles['0,0'] = { ...prospected.tiles['0,0'], structure: 'town' };
    const sold = sellInventoryItem(prospected, 'weapon-2');
    expect(sold.player.inventory.some((item) => item.id === 'weapon-2')).toBe(
      false,
    );
    expect(getGoldAmount(sold.player.inventory)).toBeGreaterThan(0);
  });

  it('merges duplicate gold stacks when sorting inventory', () => {
    const game = createGame(3, 'gold-sort-seed');
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        name: 'Gold',
        itemKey: 'gold',
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
        name: 'Gold',
        itemKey: 'gold',
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
        (item) => getItemCategory(item) === 'resource' && item.name === 'Gold',
      ),
    ).toHaveLength(1);
  });

  it('removes a bought town item from the current stock list', () => {
    const game = createGame(3, 'town-duplicate-id-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'town' };
    game.player.inventory = [
      {
        id: 'resource-gold-town-test',
        name: 'Gold',
        itemKey: 'gold',
        quantity: 100,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const stock = getTownStock(game);
    const hood = stock.find((entry) => entry.item.name === 'Scout Hood');
    expect(hood).toBeDefined();

    const boughtOnce = buyTownItem(game, hood!.item.id);
    const remainingStock = getTownStock(boughtOnce);
    const boughtTwice = buyTownItem(boughtOnce, hood!.item.id);

    expect(
      remainingStock.some((entry) => entry.item.id === hood!.item.id),
    ).toBe(false);
    expect(
      boughtTwice.logs.some((entry) => /not available here/i.test(entry.text)),
    ).toBe(true);
  });

  it('refreshes each town stock list every game day', () => {
    const game = createGame(3, 'town-daily-refresh-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'town' };
    game.player.inventory = [
      {
        id: 'resource-gold-town-refresh',
        name: 'Gold',
        itemKey: 'gold',
        quantity: 2_000,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const firstDayStock = getTownStock(game);
    const bought = buyTownItem(game, firstDayStock[0]!.item.id);

    expect(getTownStock(bought)).toHaveLength(firstDayStock.length - 1);

    const nextDayState = {
      ...bought,
      worldTimeMs: GAME_DAY_DURATION_MS,
    };
    const nextDayStock = getTownStock(nextDayState);

    expect(nextDayStock).toHaveLength(firstDayStock.length);
    expect(nextDayStock.map((entry) => entry.item.id)).not.toEqual(
      firstDayStock.map((entry) => entry.item.id),
    );
  });
});
