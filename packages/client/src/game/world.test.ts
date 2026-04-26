import { describe, expect, it } from 'vitest';

import { pickBloodMoonItemKind, pickWorldGeneratedItemKind } from './config';
import { resolveLootOutcomeRoll } from './world';
import { buildRegularTile } from './worldTileGeneration';
import { pickTerrain } from './worldTerrain';

describe('world loot roll mapping', () => {
  it('maps world-generated item kinds to equal random buckets', () => {
    expect(pickWorldGeneratedItemKind(0.0)).toBe('artifact');
    expect(pickWorldGeneratedItemKind(0.2)).toBe('weapon');
    expect(pickWorldGeneratedItemKind(0.4)).toBe('offhand');
    expect(pickWorldGeneratedItemKind(0.6)).toBe('armor');
    expect(pickWorldGeneratedItemKind(0.8)).toBe('consumable');
  });

  it('maps blood moon item kinds to equal random buckets', () => {
    expect(pickBloodMoonItemKind(0.0)).toBe('artifact');
    expect(pickBloodMoonItemKind(0.25)).toBe('weapon');
    expect(pickBloodMoonItemKind(0.5)).toBe('offhand');
    expect(pickBloodMoonItemKind(0.75)).toBe('armor');
  });

  it('inverts loot rolls into deterministic outcome rolls', () => {
    expect(resolveLootOutcomeRoll(0.01)).toBeCloseTo(0.99);
    expect(resolveLootOutcomeRoll(0.35)).toBeCloseTo(0.65);
  });

  it('builds tiles with no loot by default', () => {
    const seed = 'passive-loot-gone';
    const coords = [
      { q: 0, r: 0 },
      { q: 1, r: -2 },
      { q: -3, r: 4 },
      { q: 7, r: -5 },
    ];

    for (const coord of coords) {
      const terrain = pickTerrain(seed, coord);
      const tile = buildRegularTile(seed, coord, terrain);
      expect(tile.items).toEqual([]);
    }
  });
});
