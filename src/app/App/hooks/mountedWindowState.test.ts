import { DEFAULT_WINDOW_VISIBILITY } from '../../constants';
import { createManagedMountedWindowState } from './mountedWindowState';

describe('mountedWindowState', () => {
  it('derives mounted-window visibility from the window registry', () => {
    expect(
      createManagedMountedWindowState(
        {
          ...DEFAULT_WINDOW_VISIBILITY,
          hero: true,
          skills: true,
          inventory: true,
          log: true,
        },
        true,
        false,
      ),
    ).toEqual({
      hero: true,
      skills: true,
      recipes: false,
      hexInfo: false,
      equipment: false,
      inventory: true,
      loot: true,
      log: true,
      combat: false,
      settings: false,
    });
  });
});
