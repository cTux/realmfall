import { useEffect, useState } from 'react';
import type { AppWindowsLayout } from '../AppWindows.types';
import { DEFERRED_WINDOW_KEYS, type DeferredWindowKey } from './windowKeys';
import {
  createManagedMountedWindowState,
  pickDeferredMountedWindowState,
} from './mountedWindowState';

function mergeMountedWindowState(
  current: Record<DeferredWindowKey, boolean>,
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  const next = pickDeferredMountedWindowState(
    createManagedMountedWindowState(
      windowShown,
      keepLootWindowMounted,
      keepCombatWindowMounted,
    ),
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
  const [mountedWindows, setMountedWindows] = useState(() =>
    pickDeferredMountedWindowState(
      createManagedMountedWindowState(
        windowShown,
        keepLootWindowMounted,
        keepCombatWindowMounted,
      ),
    ),
  );

  useEffect(() => {
    setMountedWindows((current) =>
      mergeMountedWindowState(
        current,
        windowShown,
        keepLootWindowMounted,
        keepCombatWindowMounted,
      ),
    );
  }, [keepCombatWindowMounted, keepLootWindowMounted, windowShown]);

  return mountedWindows;
}
