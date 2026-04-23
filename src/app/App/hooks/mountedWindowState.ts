import type { AppWindowsLayout } from '../AppWindows.types';
import {
  DEFERRED_WINDOW_KEYS,
  type DeferredWindowKey,
  type ManagedWindowKey,
} from './windowKeys';

export function createManagedMountedWindowState(
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  return {
    hero: windowShown.hero,
    skills: windowShown.skills,
    recipes: windowShown.recipes,
    hexInfo: windowShown.hexInfo,
    equipment: windowShown.equipment,
    inventory: windowShown.inventory,
    loot: keepLootWindowMounted,
    log: windowShown.log,
    combat: keepCombatWindowMounted,
    settings: windowShown.settings,
  } satisfies Record<ManagedWindowKey, boolean>;
}

export function pickDeferredMountedWindowState(
  managedWindowState: Record<ManagedWindowKey, boolean>,
) {
  return Object.fromEntries(
    DEFERRED_WINDOW_KEYS.map((key) => [key, managedWindowState[key]]),
  ) as Record<DeferredWindowKey, boolean>;
}
