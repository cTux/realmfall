import { describe, expect, it } from 'vitest';
import type { Item } from '../stateTypes';
import {
  getConfiguredItemTint,
  getEquippableTint,
  getItemKindIcon,
  getItemTintByItemKey,
  getItemTintFallback,
} from '../../itemMetadata';

describe('shared item metadata', () => {
  it('returns armor as a shared item kind icon key', () => {
    expect(getItemKindIcon('armor')).toBe('armor');
  });

  it('keeps beet-tonic in shared configured tints', () => {
    expect(getConfiguredItemTint('beet-tonic')).toBe('#b91c1c');
  });

  it('uses the shared item-key tint override path', () => {
    expect(getItemTintByItemKey('wayfarer-cloak')).toBe('#64748b');
    expect(
      getItemTintFallback({
        itemKey: 'wayfarer-cloak',
        slot: 'cloak',
        tags: ['item.slot.cloak'],
        power: 0,
        defense: 2,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        thirst: 0,
        rarity: 'common',
      } as unknown as Item),
    ).toBe('#64748b');
  });

  it('uses the dawn set dark tone for equipable dawn cloaks', () => {
    const dawnCloak = {
      itemKey: 'dawn-cloak',
      slot: 'cloak',
      tags: ['item.slot.cloak'],
      power: 0,
      defense: 4,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
      rarity: 'common',
    } as unknown as Item;

    expect(getItemTintFallback(dawnCloak)).toBe('#b45309');
    expect(getEquippableTint(dawnCloak)).toBe('#b45309');
  });
});
