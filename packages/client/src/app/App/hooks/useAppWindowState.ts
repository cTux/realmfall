import { useCallback, useEffect, useState, type SetStateAction } from 'react';
import {
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  createWindowVisibilityState,
  type WindowPositions,
  type WindowVisibilityState,
} from '../../constants';
import { isDebugWindowRequested } from '../../debugWindow';

export function useAppWindowState() {
  const debugWindowEnabled = isDebugWindowRequested();
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowShown, setWindowShown] = useState<WindowVisibilityState>(() =>
    sanitizeWindowVisibilityState(
      DEFAULT_WINDOW_VISIBILITY,
      debugWindowEnabled,
    ),
  );

  useEffect(() => {
    setWindowShown((current) =>
      sanitizeWindowVisibilityState(current, debugWindowEnabled),
    );
  }, [debugWindowEnabled]);

  const moveWindow = useCallback(
    (
      key: keyof WindowPositions,
      position: WindowPositions[keyof WindowPositions],
    ) => {
      setWindows((current) => ({ ...current, [key]: position }));
    },
    [],
  );

  const replaceWindowShown = useCallback(
    (updater: SetStateAction<WindowVisibilityState>) => {
      setWindowShown((current) =>
        sanitizeWindowVisibilityState(
          typeof updater === 'function' ? updater(current) : updater,
          debugWindowEnabled,
        ),
      );
    },
    [debugWindowEnabled],
  );

  const setWindowVisibility = useCallback(
    (key: keyof WindowVisibilityState, shown: boolean) => {
      if (key === 'debug' && !debugWindowEnabled) {
        return;
      }

      setWindowShown((current) =>
        sanitizeWindowVisibilityState(
          { ...current, [key]: shown },
          debugWindowEnabled,
        ),
      );
    },
    [debugWindowEnabled],
  );

  const toggleDockWindow = useCallback(
    (key: keyof WindowVisibilityState) => {
      if (key === 'debug' && !debugWindowEnabled) {
        return;
      }

      setWindowShown((current) =>
        sanitizeWindowVisibilityState(
          { ...current, [key]: !current[key] },
          debugWindowEnabled,
        ),
      );
    },
    [debugWindowEnabled],
  );

  const closeAllWindows = useCallback(() => {
    setWindowShown(() =>
      sanitizeWindowVisibilityState(
        createWindowVisibilityState(false),
        debugWindowEnabled,
      ),
    );
  }, [debugWindowEnabled]);

  return {
    closeAllWindows,
    moveWindow,
    setWindowShown: replaceWindowShown,
    setWindows,
    setWindowVisibility,
    toggleDockWindow,
    windowShown,
    windows,
  };
}

function sanitizeWindowVisibilityState(
  windowShown: WindowVisibilityState,
  debugWindowEnabled: boolean,
) {
  if (debugWindowEnabled || !windowShown.debug) {
    return windowShown;
  }

  return {
    ...windowShown,
    debug: false,
  };
}
