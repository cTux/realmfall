import { describe, expect, it } from 'vitest';
import { buildItemFromConfig } from './content/items';
import { getTownStockPrice } from './economy';

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
});
