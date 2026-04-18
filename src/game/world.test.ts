import { describe, expect, it } from 'vitest';

import { pickWorldGeneratedItemKind, WORLD_LOOT_CHANCES } from './config';
import { resolveLootOutcomeRoll } from './world';

describe('world loot roll mapping', () => {
  it('maps successful low probability rolls back to premium loot outcomes', () => {
    const outcomeRoll = resolveLootOutcomeRoll(0.01);

    expect(outcomeRoll).toBeCloseTo(0.99);
    expect(pickWorldGeneratedItemKind(outcomeRoll)).toBe('artifact');
    expect(outcomeRoll >= 1 - WORLD_LOOT_CHANCES.bonusCache).toBe(true);
  });
});
