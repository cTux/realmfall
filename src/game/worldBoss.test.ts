import { describe, expect, it, vi } from 'vitest';
import * as shared from './shared';
import { isWorldBossCenter } from './worldBoss';

describe('worldBoss', () => {
  it('keeps distant boss spawning probabilistic by capping distance weighting', () => {
    const noiseSpy = vi.spyOn(shared, 'noise').mockReturnValue(0);

    expect(
      isWorldBossCenter('boss-distance-cap', { q: 20, r: 0 }, 'forest'),
    ).toBe(false);

    noiseSpy.mockRestore();
  });
});
