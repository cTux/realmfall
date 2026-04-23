import { describe, expect, it } from 'vitest';
import {
  getItemCategory,
  getItemConfigCategory,
  inferItemTags,
} from './itemClassification';
import { townKnifeItemConfig } from './townKnife';

describe('item classification helpers', () => {
  it('keeps configured equipment categories on the dedicated helper module', () => {
    expect(getItemConfigCategory(townKnifeItemConfig)).toBe('weapon');
  });

  it('infers uncatalogued consumable categories and tags from values', () => {
    const item = {
      name: 'Emergency Tonic',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 12,
      hunger: 0,
      thirst: 0,
    };

    expect(getItemCategory(item)).toBe('consumable');
    expect(inferItemTags(item)).toEqual(
      expect.arrayContaining(['item.consumable', 'item.healing']),
    );
  });
});
