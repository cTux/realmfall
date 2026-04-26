import { useCallback, useState } from 'react';
import {
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  createWindowVisibilityState,
  type WindowPositions,
  type WindowVisibilityState,
} from '../../constants';

export function useAppWindowState() {
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowShown, setWindowShown] = useState<WindowVisibilityState>(
    DEFAULT_WINDOW_VISIBILITY,
  );

  const moveWindow = useCallback(
    (
      key: keyof WindowPositions,
      position: WindowPositions[keyof WindowPositions],
    ) => {
      setWindows((current) => ({ ...current, [key]: position }));
    },
    [],
  );

  const setWindowVisibility = useCallback(
    (key: keyof WindowVisibilityState, shown: boolean) => {
      setWindowShown((current) => ({ ...current, [key]: shown }));
    },
    [],
  );

  const toggleDockWindow = useCallback((key: keyof WindowVisibilityState) => {
    setWindowShown((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const closeAllWindows = useCallback(() => {
    setWindowShown(() => createWindowVisibilityState(false));
  }, []);

  return {
    closeAllWindows,
    moveWindow,
    setWindowShown,
    setWindows,
    setWindowVisibility,
    toggleDockWindow,
    windowShown,
    windows,
  };
}
