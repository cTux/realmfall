import { useMemo } from 'react';
import type { AppWindowsLayout } from '../AppWindows.types';
import type { useAppWindowHandlers } from './useAppWindowHandlers';
import { WINDOW_HANDLER_KEYS, type ManagedWindowKey } from './windowKeys';

type ManagedWindowProps = {
  [K in ManagedWindowKey]: {
    position: AppWindowsLayout['windows'][K];
    onMove: ReturnType<typeof useAppWindowHandlers>['windowMoveHandlers'][K];
    visible: AppWindowsLayout['windowShown'][K];
    onClose: ReturnType<typeof useAppWindowHandlers>['windowCloseHandlers'][K];
  };
};

function createManagedWindowProps({
  windows,
  windowShown,
  windowMoveHandlers,
  windowCloseHandlers,
}: {
  windows: AppWindowsLayout['windows'];
  windowShown: AppWindowsLayout['windowShown'];
  windowMoveHandlers: ReturnType<
    typeof useAppWindowHandlers
  >['windowMoveHandlers'];
  windowCloseHandlers: ReturnType<
    typeof useAppWindowHandlers
  >['windowCloseHandlers'];
}): ManagedWindowProps {
  return WINDOW_HANDLER_KEYS.reduce((managedWindowProps, key) => {
    managedWindowProps[key] = {
      position: windows[key],
      onMove: windowMoveHandlers[key],
      visible: windowShown[key],
      onClose: windowCloseHandlers[key],
    };
    return managedWindowProps;
  }, {} as ManagedWindowProps);
}

export function useManagedWindowProps({
  windows,
  windowShown,
  windowMoveHandlers,
  windowCloseHandlers,
}: {
  windows: AppWindowsLayout['windows'];
  windowShown: AppWindowsLayout['windowShown'];
  windowMoveHandlers: ReturnType<
    typeof useAppWindowHandlers
  >['windowMoveHandlers'];
  windowCloseHandlers: ReturnType<
    typeof useAppWindowHandlers
  >['windowCloseHandlers'];
}) {
  return useMemo(
    () =>
      createManagedWindowProps({
        windows,
        windowShown,
        windowMoveHandlers,
        windowCloseHandlers,
      }),
    [windows, windowShown, windowMoveHandlers, windowCloseHandlers],
  );
}
