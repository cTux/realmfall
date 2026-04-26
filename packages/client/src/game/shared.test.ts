import { describe, expect, it } from 'vitest';
import { resolveCascadingRarity } from './shared';

describe('cascading rarity resolution', () => {
  it('checks rarity chances from legendary down to uncommon before falling back to common', () => {
    expect(resolveCascadingRarity(() => 0.0001)).toBe('legendary');
    expect(
      resolveCascadingRarity(
        (() => {
          const rolls = [0.9, 0.001];
          return () => rolls.shift() ?? 1;
        })(),
      ),
    ).toBe('epic');
    expect(
      resolveCascadingRarity(
        (() => {
          const rolls = [0.9, 0.9, 0.04];
          return () => rolls.shift() ?? 1;
        })(),
      ),
    ).toBe('rare');
    expect(
      resolveCascadingRarity(
        (() => {
          const rolls = [0.9, 0.9, 0.9, 0.2];
          return () => rolls.shift() ?? 1;
        })(),
      ),
    ).toBe('uncommon');
    expect(resolveCascadingRarity(() => 0.9)).toBe('common');
  });

  it('respects minimum rarity floors after the cascading checks', () => {
    expect(resolveCascadingRarity(() => 0.9, 'rare')).toBe('rare');
  });
});
