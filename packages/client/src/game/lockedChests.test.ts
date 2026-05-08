import { describe, expect, it } from 'vitest';
import { getLockpickBreakChance, isLockedChestMimic } from './lockedChestsTestkit';

describe('locked chest rules', () => {
  it('reduces lockpick break chance by 0.5 percent per level down to the 25 percent floor', () => {
    expect(getLockpickBreakChance(1)).toBeCloseTo(0.75);
    expect(getLockpickBreakChance(50)).toBeCloseTo(0.505);
    expect(getLockpickBreakChance(200)).toBe(0.25);
  });

  it('resolves mimic replacement deterministically from seed and chest coord', () => {
    expect(isLockedChestMimic('locked-chest-seed', { q: 3, r: -1 })).toBe(
      isLockedChestMimic('locked-chest-seed', { q: 3, r: -1 }),
    );
  });
});
