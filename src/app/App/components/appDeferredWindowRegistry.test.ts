import { describe, expect, it } from 'vitest';
import {
  APP_DEFERRED_WINDOW_KEYS,
  getMountedDeferredWindowKeys,
} from './appDeferredWindowRegistry';

describe('app deferred window registry', () => {
  it('keeps one canonical deferred window order', () => {
    expect(APP_DEFERRED_WINDOW_KEYS).toEqual([
      'skills',
      'recipes',
      'hexInfo',
      'equipment',
      'inventory',
      'log',
      'settings',
    ]);
  });

  it('filters mounted deferred windows in registry order', () => {
    expect(
      getMountedDeferredWindowKeys({
        skills: true,
        recipes: false,
        hexInfo: true,
        equipment: false,
        inventory: true,
        log: false,
        settings: true,
      }),
    ).toEqual(['skills', 'hexInfo', 'inventory', 'settings']);
  });
});
