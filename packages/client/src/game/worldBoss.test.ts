import { describe, expect, it, vi } from 'vitest';
import * as shared from './shared';
import { hexKey } from './hex';
import * as worldTerrain from './worldTerrain';
import { isWorldBossCenter } from './worldBoss';

describe('worldBoss', () => {
  it('keeps distant boss spawning probabilistic by capping distance weighting', () => {
    const noiseSpy = vi.spyOn(shared, 'noise').mockReturnValue(0);

    expect(
      isWorldBossCenter('boss-distance-cap', { q: 20, r: 0 }, 'forest'),
    ).toBe(false);

    noiseSpy.mockRestore();
  });

  it('rejects boss centers whose footprint would overlap a stronger nearby boss', () => {
    const scores: Record<string, number> = {
      [hexKey({ q: 4, r: 0 })]: 0.82,
      [hexKey({ q: 6, r: 0 })]: 0.91,
    };
    const terrainSpy = vi
      .spyOn(worldTerrain, 'pickTerrain')
      .mockReturnValue('forest');
    const noiseSpy = vi
      .spyOn(shared, 'noise')
      .mockImplementation((_, coord) => scores[hexKey(coord)] ?? 0);

    expect(isWorldBossCenter('boss-spacing', { q: 4, r: 0 }, 'forest')).toBe(
      false,
    );
    expect(isWorldBossCenter('boss-spacing', { q: 6, r: 0 }, 'forest')).toBe(
      true,
    );

    noiseSpy.mockRestore();
    terrainSpy.mockRestore();
  });
});
