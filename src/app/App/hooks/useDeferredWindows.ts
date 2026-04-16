import { useEffect, useState } from 'react';
import type { AppWindowsLayout } from '../AppWindows.types';
import { DEFERRED_WINDOW_KEYS, type DeferredWindowKey } from './windowKeys';

function createLoadedWindowState(
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  return {
    skills: windowShown.skills,
    recipes: windowShown.recipes,
    hexInfo: windowShown.hexInfo,
    equipment: windowShown.equipment,
    inventory: windowShown.inventory,
    loot: keepLootWindowMounted,
    log: windowShown.log,
    combat: keepCombatWindowMounted,
    settings: windowShown.settings,
  } satisfies Record<DeferredWindowKey, boolean>;
}

function mergeLoadedWindowState(
  current: Record<DeferredWindowKey, boolean>,
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  const next = createLoadedWindowState(
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
  );

  for (const key of DEFERRED_WINDOW_KEYS) {
    next[key] = current[key] || next[key];
  }

  return DEFERRED_WINDOW_KEYS.every((key) => current[key] === next[key])
    ? current
    : next;
}

export function useDeferredWindows({
  windowShown,
  keepLootWindowMounted,
  keepCombatWindowMounted,
}: Pick<
  AppWindowsLayout,
  'windowShown' | 'keepLootWindowMounted' | 'keepCombatWindowMounted'
>) {
  const [loadedWindows, setLoadedWindows] = useState(() =>
    createLoadedWindowState(
      windowShown,
      keepLootWindowMounted,
      keepCombatWindowMounted,
    ),
  );

  useEffect(() => {
    setLoadedWindows((current) =>
      mergeLoadedWindowState(
        current,
        windowShown,
        keepLootWindowMounted,
        keepCombatWindowMounted,
      ),
    );
  }, [keepCombatWindowMounted, keepLootWindowMounted, windowShown]);

  return loadedWindows;
}
