import { useEffect, useState } from 'react';
import type { AppWindowsLayout } from '../AppWindows.types';
import { DEFERRED_WINDOW_KEYS, type DeferredWindowKey } from './windowKeys';

function createLoadedWindowState(
  windowShown: AppWindowsLayout['windowShown'],
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) {
  return {
    skills: windowShown.skills,
    recipes: windowShown.recipes,
    hexInfo: windowShown.hexInfo,
    equipment: windowShown.equipment,
    inventory: windowShown.inventory,
    loot: renderLootWindow,
    log: windowShown.log,
    combat: renderCombatWindow,
    settings: windowShown.settings,
  } satisfies Record<DeferredWindowKey, boolean>;
}

function mergeLoadedWindowState(
  current: Record<DeferredWindowKey, boolean>,
  windowShown: AppWindowsLayout['windowShown'],
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) {
  const next = createLoadedWindowState(
    windowShown,
    renderLootWindow,
    renderCombatWindow,
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
  renderLootWindow,
  renderCombatWindow,
}: Pick<
  AppWindowsLayout,
  'windowShown' | 'renderLootWindow' | 'renderCombatWindow'
>) {
  const [loadedWindows, setLoadedWindows] = useState(() =>
    createLoadedWindowState(windowShown, renderLootWindow, renderCombatWindow),
  );

  useEffect(() => {
    setLoadedWindows((current) =>
      mergeLoadedWindowState(
        current,
        windowShown,
        renderLootWindow,
        renderCombatWindow,
      ),
    );
  }, [renderCombatWindow, renderLootWindow, windowShown]);

  return loadedWindows;
}
