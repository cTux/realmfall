import { describe, expect, it } from 'vitest';
import { makeWorldGeneratedItem } from './worldGeneratedItems';

describe('world generated items', () => {
  it('uses the consumable bucket for the top loot roll band', () => {
    const item = makeWorldGeneratedItem(
      'world-generated-item',
      { q: 2, r: 0 },
      3,
      0.95,
    );

    expect(item.itemKey).toBe('trail-ration');
    expect(item.name).toBe('Trail Ration');
    expect(item.healing).toBe(8);
    expect(item.hunger).toBe(12);
  });
});
