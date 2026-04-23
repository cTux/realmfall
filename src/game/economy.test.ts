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
});
