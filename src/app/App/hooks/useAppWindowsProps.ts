import { useMemo } from 'react';
import type {
  AppWindowsActions,
  AppWindowsProps,
  AppWindowsViewState,
} from '../AppWindows.types';

interface UseAppWindowsPropsArgs {
  windows: AppWindowsProps['layout']['windows'];
  windowShown: AppWindowsProps['layout']['windowShown'];
  keepLootWindowMounted: AppWindowsProps['layout']['keepLootWindowMounted'];
  keepCombatWindowMounted: AppWindowsProps['layout']['keepCombatWindowMounted'];
  tooltipPositionRef: AppWindowsProps['layout']['tooltipPositionRef'];
  views: AppWindowsViewState;
  actions: AppWindowsActions;
}

export function useAppWindowsProps({
  windows,
  windowShown,
  keepLootWindowMounted,
  keepCombatWindowMounted,
  tooltipPositionRef,
  views,
  actions,
}: UseAppWindowsPropsArgs): AppWindowsProps {
  const layout = useMemo(
    () => ({
      windows,
      windowShown,
      keepLootWindowMounted,
      keepCombatWindowMounted,
      tooltipPositionRef,
    }),
    [
      keepCombatWindowMounted,
      keepLootWindowMounted,
      tooltipPositionRef,
      windowShown,
      windows,
    ],
  );

  return useMemo(
    () => ({
      layout,
      views,
      actions,
    }),
    [actions, layout, views],
  );
}
