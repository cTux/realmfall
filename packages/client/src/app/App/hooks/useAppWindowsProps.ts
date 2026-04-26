import { useMemo } from 'react';
import type {
  AppWindowsActions,
  AppWindowsProps,
  AppWindowsViewState,
} from '../AppWindows.types';

interface UseAppWindowsPropsArgs {
  appReady: boolean;
  windows: AppWindowsProps['layout']['windows'];
  windowShown: AppWindowsProps['layout']['windowShown'];
  keepLootWindowMounted: AppWindowsProps['layout']['keepLootWindowMounted'];
  keepCombatWindowMounted: AppWindowsProps['layout']['keepCombatWindowMounted'];
  tooltipPositionRef: AppWindowsProps['layout']['tooltipPositionRef'];
  views: AppWindowsViewState;
  actions: AppWindowsActions;
}

export function useAppWindowsProps({
  appReady,
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
      appReady,
      windows,
      windowShown,
      keepLootWindowMounted,
      keepCombatWindowMounted,
      tooltipPositionRef,
    }),
    [
      appReady,
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
