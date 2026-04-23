import type { AppWindowsLayout } from '../AppWindows.types';
import {
  WINDOW_REGISTRY,
  WINDOW_VISIBILITY_KEYS,
  type WindowKey,
} from '../../constants';

export function createManagedMountedWindowState(
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  return Object.fromEntries(
    WINDOW_VISIBILITY_KEYS.map((key) => [
      key,
      resolveMountedWindowValue(
        key,
        windowShown,
        keepLootWindowMounted,
        keepCombatWindowMounted,
      ),
    ]),
  ) as Record<WindowKey, boolean>;
}

function resolveMountedWindowValue(
  key: WindowKey,
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  switch (WINDOW_REGISTRY[key].mountSource) {
    case 'lootTransition':
      return keepLootWindowMounted;
    case 'combatTransition':
      return keepCombatWindowMounted;
    default:
      return windowShown[key];
  }
}
