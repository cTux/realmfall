import { useMemo } from 'react';
import type { AppWindowsProps } from '../AppWindows.types';
import {
  WINDOW_HANDLER_KEYS,
  type ManagedWindowKey,
  type ManagedWindowPosition,
} from './windowKeys';

function createWindowMoveHandlers(
  onMoveWindow: AppWindowsProps['onMoveWindow'],
) {
  return WINDOW_HANDLER_KEYS.reduce(
    (handlers, key) => {
      handlers[key] = (position) => onMoveWindow(key, position);
      return handlers;
    },
    {} as {
      [K in ManagedWindowKey]: (position: ManagedWindowPosition[K]) => void;
    },
  );
}

function createWindowCloseHandlers(
  onSetWindowVisibility: AppWindowsProps['onSetWindowVisibility'],
) {
  return WINDOW_HANDLER_KEYS.reduce(
    (handlers, key) => {
      handlers[key] = () => onSetWindowVisibility(key, false);
      return handlers;
    },
    {} as { [K in ManagedWindowKey]: () => void },
  );
}

export function useAppWindowHandlers({
  onMoveWindow,
  onSetWindowVisibility,
}: Pick<AppWindowsProps, 'onMoveWindow' | 'onSetWindowVisibility'>) {
  const windowMoveHandlers = useMemo(
    () => createWindowMoveHandlers(onMoveWindow),
    [onMoveWindow],
  );
  const windowCloseHandlers = useMemo(
    () => createWindowCloseHandlers(onSetWindowVisibility),
    [onSetWindowVisibility],
  );

  return { windowMoveHandlers, windowCloseHandlers };
}
