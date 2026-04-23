import { DEFAULT_WINDOW_VISIBILITY } from '../../constants';
import {
  createManagedMountedWindowState,
  pickDeferredMountedWindowState,
} from './mountedWindowState';

describe('mountedWindowState', () => {
  it('derives managed and deferred mounted-window visibility from one source', () => {
    const managed = createManagedMountedWindowState(
      {
        ...DEFAULT_WINDOW_VISIBILITY,
        hero: true,
        skills: true,
        inventory: true,
        log: true,
      },
      true,
      false,
    );

    expect(managed).toEqual({
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
    expect(pickDeferredMountedWindowState(managed)).toEqual({
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
