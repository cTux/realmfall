describe('renderSceneCache', () => {
  it('bounds scene caches with LRU-style eviction', async () => {
    const { getCachedValue, SCENE_CACHE_LIMITS, setBoundedCachedValue } =
      await import('./renderSceneCache');

    const cache = new Map<string, string>();
    const maxEntries = 3;

    setBoundedCachedValue(cache, 'a', 'A', maxEntries);
    setBoundedCachedValue(cache, 'b', 'B', maxEntries);
    setBoundedCachedValue(cache, 'c', 'C', maxEntries);
    expect(getCachedValue(cache, 'a')).toBe('A');

    setBoundedCachedValue(cache, 'd', 'D', maxEntries);

    expect(cache.size).toBe(maxEntries);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(SCENE_CACHE_LIMITS.cloudInputsBySeed).toBe(maxEntries + 1);
  });
});
