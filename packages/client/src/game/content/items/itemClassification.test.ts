import { describe, expect, it } from 'vitest';
import { getItemCategory as getSharedItemCategory } from '@realmfall/ui-react';
import {
  getItemCategory,
  getItemConfigCategory,
  inferItemTags,
} from './itemClassificationTestkit';
import { townKnifeItemConfig } from './townKnife';

describe('item classification helpers', () => {
  it('keeps configured equipment categories on the dedicated helper module', () => {
    expect(getItemConfigCategory(townKnifeItemConfig)).toBe('weapon');
  });

  it('classifies sparse cloaks as armor consistently across shared and client callers', () => {
    const sparseCloak = {
      name: 'Cloak Fragment',
      slot: 'cloak',
      power: 0,
      defense: 4,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    } as const;

    expect(getSharedItemCategory(sparseCloak)).toBe('armor');
    expect(getItemCategory(sparseCloak)).toBe('armor');
  });

  it('classifies sparse relics as artifact consistently across shared and client callers', () => {
    const sparseRelic = {
      name: 'Spurious Relic',
      itemKey: 'generated-spurious-relic',
      slot: 'relic',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    } as const;

    expect(getSharedItemCategory(sparseRelic)).toBe('artifact');
    expect(getItemCategory(sparseRelic)).toBe('artifact');
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
