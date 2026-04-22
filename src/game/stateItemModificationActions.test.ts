import { createRng } from './random';
import {
  corruptInventoryItem,
  createGame,
  enchantInventoryItem,
  getGoldAmount,
  reforgeInventoryItem,
} from './state';
import { getItemModificationCost } from './itemModifications';

describe('game state item modification actions', () => {
  it('reforges only the selected stat and locks future rerolls to that stat', () => {
    const game = createGame(3, 'reforge-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'rune-forge' };
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        itemKey: 'gold',
        name: 'Gold',
        quantity: 500,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'weapon-1',
        slot: 'weapon',
        name: 'Rune Blade',
        quantity: 1,
        tier: 8,
        rarity: 'rare',
        power: 80,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        secondaryStatCapacity: 2,
        secondaryStats: [
          { key: 'attackSpeed', value: 4 },
          { key: 'dodgeChance', value: 4 },
        ],
      },
    ];

    const item = game.player.inventory[1]!;
    const reforgeCost = getItemModificationCost(item, 'reforge');
    const reforged = reforgeInventoryItem(game, item.id, 1);
    const reforgedItem = reforged.player.inventory.find(
      (entry) => entry.id === item.id,
    )!;

    expect(reforgedItem.reforgedSecondaryStatIndex).toBe(1);
    expect(reforgedItem.secondaryStats?.[0]?.key).toBe('attackSpeed');
    expect(reforgedItem.secondaryStats?.[1]?.key).not.toBe('dodgeChance');
    expect(getGoldAmount(reforged.player.inventory)).toBe(500 - reforgeCost);

    const restricted = reforgeInventoryItem(reforged, item.id, 0);
    const restrictedItem = restricted.player.inventory.find(
      (entry) => entry.id === item.id,
    )!;

    expect(restrictedItem.secondaryStats).toEqual(reforgedItem.secondaryStats);
    expect(restricted.logs[0]?.text).toMatch(/same pink stat/i);
  });

  it('adds and replaces an enchanted stat without growing the item stats list', () => {
    const game = createGame(3, 'enchant-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'mana-font' };
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        itemKey: 'gold',
        name: 'Gold',
        quantity: 500,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'weapon-1',
        slot: 'weapon',
        name: 'Arc Blade',
        quantity: 1,
        tier: 10,
        rarity: 'epic',
        power: 100,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        secondaryStatCapacity: 2,
        secondaryStats: [{ key: 'criticalStrikeChance', value: 5 }],
      },
    ];

    const item = game.player.inventory[1]!;
    const enchantCost = getItemModificationCost(item, 'enchant');
    const enchanted = enchantInventoryItem(game, item.id);
    const enchantedItem = enchanted.player.inventory.find(
      (entry) => entry.id === item.id,
    )!;
    const enchantedIndex = enchantedItem.enchantedSecondaryStatIndex;

    expect(enchantedIndex).toBeDefined();
    expect(enchantedItem.secondaryStats).toHaveLength(2);
    expect(enchantedItem.secondaryStats?.[enchantedIndex ?? -1]?.key).not.toBe(
      'criticalStrikeChance',
    );
    expect(getGoldAmount(enchanted.player.inventory)).toBe(500 - enchantCost);

    const firstEnchantKey =
      enchantedItem.secondaryStats?.[enchantedIndex ?? -1]?.key;
    const reEnchanted = enchantInventoryItem(enchanted, item.id);
    const reEnchantedItem = reEnchanted.player.inventory.find(
      (entry) => entry.id === item.id,
    )!;

    expect(reEnchantedItem.secondaryStats).toHaveLength(2);
    expect(reEnchantedItem.enchantedSecondaryStatIndex).toBe(enchantedIndex);
    expect(
      reEnchantedItem.secondaryStats?.[enchantedIndex ?? -1]?.key,
    ).not.toBe(firstEnchantKey);
  });

  it('corrupts an item, boosts its stats, and blocks further modification', () => {
    const game = createGame(3, 'corrupt-success-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'corruption-altar' };
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        itemKey: 'gold',
        name: 'Gold',
        quantity: 500,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'weapon-1',
        slot: 'weapon',
        name: 'Void Saber',
        quantity: 1,
        tier: 12,
        rarity: 'epic',
        power: 120,
        defense: 12,
        maxHp: 24,
        healing: 0,
        hunger: 0,
        secondaryStatCapacity: 2,
        secondaryStats: [{ key: 'criticalStrikeChance', value: 6 }],
      },
    ];

    const item = game.player.inventory[1]!;
    const corruptCost = getItemModificationCost(item, 'corrupt');
    const corrupted = corruptInventoryItem(game, item.id);
    const corruptedItem = corrupted.player.inventory.find(
      (entry) => entry.id === item.id,
    )!;

    expect(corruptedItem.corrupted).toBe(true);
    expect(corruptedItem.power).toBeGreaterThan(item.power);
    expect(corruptedItem.defense).toBeGreaterThan(item.defense);
    expect(corruptedItem.maxHp).toBeGreaterThan(item.maxHp);
    expect(corruptedItem.secondaryStats?.[0]?.value).toBeGreaterThan(
      item.secondaryStats?.[0]?.value ?? 0,
    );
    expect(getGoldAmount(corrupted.player.inventory)).toBe(500 - corruptCost);

    corrupted.tiles['0,0'] = {
      ...corrupted.tiles['0,0'],
      structure: 'mana-font',
    };
    const blocked = enchantInventoryItem(corrupted, item.id);

    expect(blocked.logs[0]?.text).toMatch(/can no longer be modified/i);
  });

  it('can shatter an item during corruption while still consuming gold', () => {
    const itemId = 'weapon-1';
    const breakSeed = findCorruptionBreakSeed(itemId);
    const game = createGame(3, breakSeed);
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'corruption-altar' };
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        itemKey: 'gold',
        name: 'Gold',
        quantity: 500,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: itemId,
        slot: 'weapon',
        name: 'Fractured Edge',
        quantity: 1,
        tier: 7,
        rarity: 'rare',
        power: 70,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const corruptCost = getItemModificationCost(
      game.player.inventory[1]!,
      'corrupt',
    );
    const corrupted = corruptInventoryItem(game, itemId);

    expect(
      corrupted.player.inventory.some((entry) => entry.id === itemId),
    ).toBe(false);
    expect(getGoldAmount(corrupted.player.inventory)).toBe(500 - corruptCost);
    expect(corrupted.logs[0]?.text).toMatch(/shatters/i);
  });
});

function findCorruptionBreakSeed(itemId: string) {
  for (let index = 0; index < 10_000; index += 1) {
    const seed = `corrupt-break-${index}`;
    const rng = createRng(`${seed}:item-modification:corrupt:${itemId}:0:3`);
    if (rng() < 0.05) {
      return seed;
    }
  }

  throw new Error('Failed to find a deterministic corruption break seed.');
}
