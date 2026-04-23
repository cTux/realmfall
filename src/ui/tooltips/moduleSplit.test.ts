import { describe, expect, it } from 'vitest';
import type { Item } from '../../game/stateTypes';
import { itemTooltipLines } from './itemTooltips';
import { abilityTooltipLines } from './abilityTooltips';

describe('tooltip module split', () => {
  it('keeps item tooltip builders in the item tooltip module', () => {
    const lines = itemTooltipLines({
      id: 'gold-1',
      itemKey: 'gold',
      name: 'Gold',
      quantity: 3,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    } satisfies Item);

    expect(lines.some((line) => line.text?.includes('Tags:'))).toBe(true);
  });

  it('keeps ability tooltip builders in the ability tooltip module', () => {
    expect(
      abilityTooltipLines({
        description: 'Targets one enemy. Deals melee damage.',
        category: 'attacking',
        manaCost: 0,
        cooldownMs: 1000,
        castTimeMs: 0,
        effects: [{ kind: 'damage', powerMultiplier: 1 }],
        tags: [],
      })[0],
    ).toEqual({
      kind: 'text',
      text: 'Targets one enemy. Deals melee damage.',
    });
  });
});
