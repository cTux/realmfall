import { useEffect, useRef, useState } from 'react';
import type { AppWindowsLayout } from '../AppWindows.types';
import { WINDOW_HANDLER_KEYS, type ManagedWindowKey } from './windowKeys';

const WINDOW_UNMOUNT_DELAY_MS = 180;

function createMountedWindowState(
  windowShown: AppWindowsLayout['windowShown'],
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  return {
    worldTime: windowShown.worldTime,
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

export function useMountedWindows({
  windowShown,
  keepLootWindowMounted,
  keepCombatWindowMounted,
}: Pick<
  AppWindowsLayout,
  'windowShown' | 'keepLootWindowMounted' | 'keepCombatWindowMounted'
>) {
  const targetMountedWindows = createMountedWindowState(
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
  );
  const [mountedWindows, setMountedWindows] = useState(targetMountedWindows);
  const hideTimeoutsRef = useRef<Partial<Record<ManagedWindowKey, number>>>({});

  useEffect(() => {
    for (const key of WINDOW_HANDLER_KEYS) {
      const shouldMount = targetMountedWindows[key];
      const pendingTimeout = hideTimeoutsRef.current[key];

      if (shouldMount) {
        if (pendingTimeout !== undefined) {
          window.clearTimeout(pendingTimeout);
          delete hideTimeoutsRef.current[key];
        }

        setMountedWindows((current) =>
          current[key] ? current : { ...current, [key]: true },
        );
        continue;
      }

      if (pendingTimeout !== undefined) {
        continue;
      }

      hideTimeoutsRef.current[key] = window.setTimeout(() => {
        setMountedWindows((current) =>
          current[key] ? { ...current, [key]: false } : current,
        );
        delete hideTimeoutsRef.current[key];
      }, WINDOW_UNMOUNT_DELAY_MS);
    }

    return () => {
      for (const timeout of Object.values(hideTimeoutsRef.current)) {
        if (timeout !== undefined) {
          window.clearTimeout(timeout);
        }
      }

      hideTimeoutsRef.current = {};
    };
  }, [targetMountedWindows]);

  return mountedWindows;
}
