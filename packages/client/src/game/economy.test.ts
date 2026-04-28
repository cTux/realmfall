import { describe, expect, it } from 'vitest';
import {
  buildItemFromConfig,
  getItemCategory,
  getItemConfigByKey,
} from './content/items';
import { buildTownStock, getTownStockPrice } from './economy';

describe('town stock pricing', () => {
  it('scales buy prices sharply with item rarity', () => {
    const commonKnife = buildItemFromConfig('town-knife', {
      id: 'town-knife-common',
      rarity: 'common',
      tier: 1,
    });
    const legendaryKnife = buildItemFromConfig('town-knife', {
      id: 'town-knife-legendary',
      rarity: 'legendary',
      tier: 1,
    });

    expect(getTownStockPrice(commonKnife)).toBe(24);
    expect(getTownStockPrice(legendaryKnife)).toBe(864);
    expect(getTownStockPrice(legendaryKnife)).toBeGreaterThan(
      getTownStockPrice(commonKnife) * 20,
    );
  });

  it('adds a town-only level markup on top of rarity scaling', () => {
    const levelOneKnife = buildItemFromConfig('town-knife', {
      id: 'town-knife-level-1',
      rarity: 'common',
      tier: 1,
    });
    const levelTenKnife = buildItemFromConfig('town-knife', {
      id: 'town-knife-level-10',
      rarity: 'common',
      tier: 10,
    });

    expect(getTownStockPrice(levelOneKnife)).toBe(24);
    expect(getTownStockPrice(levelTenKnife)).toBe(114);
    expect(getTownStockPrice(levelTenKnife)).toBeGreaterThan(
      getTownStockPrice(levelOneKnife),
    );
  });

  it('prices base consumables with the separate medium-town consumable scale', () => {
    const commonPotion = buildItemFromConfig('health-potion', {
      id: 'health-potion-common',
      rarity: 'common',
      tier: 1,
    });
    const highLevelPotion = buildItemFromConfig('health-potion', {
      id: 'health-potion-high-level',
      rarity: 'common',
      tier: 10,
    });

    expect(getTownStockPrice(commonPotion)).toBeGreaterThan(1);
    expect(getTownStockPrice(highLevelPotion)).toBeGreaterThan(
      getTownStockPrice(commonPotion),
    );
  });

  it('keeps crafted-food consumables priced above standard consumables', () => {
    const craftedFood = buildItemFromConfig('trail-ration', {
      id: 'trail-ration-tier-9',
      rarity: 'common',
      tier: 10,
    });
    const reagent = buildItemFromConfig('cooked-fish', {
      id: 'cooked-fish-tier-9',
      rarity: 'common',
      tier: 10,
    });

    expect(getTownStockPrice(craftedFood)).toBeGreaterThan(
      getTownStockPrice(reagent),
    );
  });

  it('prices terraforming consumables as premium consumables', () => {
    const terraformPlains = buildItemFromConfig('terraforming-plains', {
      id: 'terraforming-plains-town',
      rarity: 'common',
      tier: 1,
    });
    const potion = buildItemFromConfig('health-potion', {
      id: 'health-potion-town',
      rarity: 'common',
      tier: 1,
    });

    expect(getTownStockPrice(terraformPlains)).toBeGreaterThan(
      getTownStockPrice(potion),
    );
    expect(getTownStockPrice(terraformPlains)).toBeGreaterThanOrEqual(50);
  });

  it('adds four random consumables and sorts them before equippables', () => {
    const stock = buildTownStock('town-stock-seed', { q: 0, r: 0 });
    const consumableStockEntries = stock.filter(
      (entry) => getItemCategory(entry.item) === 'consumable',
    );
    const firstNonConsumableIndex = stock.findIndex(
      (entry) => getItemCategory(entry.item) !== 'consumable',
    );

    expect(consumableStockEntries).toHaveLength(4);
    expect(firstNonConsumableIndex).toBeGreaterThanOrEqual(4);
    expect(
      stock
        .slice(0, firstNonConsumableIndex)
        .every((entry) => getItemCategory(entry.item) === 'consumable'),
    ).toBe(true);
  });

  it('keeps town-stock consumables at their configured rarity', () => {
    const mismatches = [
      { seed: 'town-consumable-rarity-a', coord: { q: 12, r: 0 }, day: 3 },
      { seed: 'town-consumable-rarity-b', coord: { q: 24, r: 0 }, day: 8 },
      { seed: 'town-consumable-rarity-c', coord: { q: 36, r: 0 }, day: 13 },
      { seed: 'town-consumable-rarity-d', coord: { q: 48, r: 0 }, day: 21 },
    ].flatMap(({ seed, coord, day }) =>
      buildTownStock(seed, coord, day)
        .map((entry) => entry.item)
        .filter((item) => getItemCategory(item) === 'consumable')
        .filter(
          (item) =>
            item.itemKey &&
            item.rarity !== getItemConfigByKey(item.itemKey)?.rarity,
        )
        .map((item) => ({
          itemKey: item.itemKey,
          rarity: item.rarity,
          seed,
          day,
          coord,
        })),
    );

    expect(mismatches).toEqual([]);
  });
});
