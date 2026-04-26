import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppWindowsLayout } from '../AppWindows.types';
import { WINDOW_HANDLER_KEYS, type ManagedWindowKey } from './windowKeys';
import { createManagedMountedWindowState } from './mountedWindowState';

const WINDOW_UNMOUNT_DELAY_MS = 180;

export function useMountedWindows({
  windowShown,
  keepLootWindowMounted,
  keepCombatWindowMounted,
}: Pick<
  AppWindowsLayout,
  'windowShown' | 'keepLootWindowMounted' | 'keepCombatWindowMounted'
>) {
  const targetMountedWindows = useMemo<Record<ManagedWindowKey, boolean>>(
    () =>
      createManagedMountedWindowState(
        windowShown,
        keepLootWindowMounted,
        keepCombatWindowMounted,
      ),
    [keepCombatWindowMounted, keepLootWindowMounted, windowShown],
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
  }, [targetMountedWindows]);

  useEffect(
    () => () => {
      for (const timeout of Object.values(hideTimeoutsRef.current)) {
        if (timeout !== undefined) {
          window.clearTimeout(timeout);
        }
      }

      hideTimeoutsRef.current = {};
    },
    [],
  );

  return mountedWindows;
}
