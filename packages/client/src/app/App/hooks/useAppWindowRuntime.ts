import { useAppWindowActions } from './useAppWindowActions';
import { useAppWindowViews } from './useAppWindowViews';
import { useAppWindowsProps } from './useAppWindowsProps';

type WindowViewsArgs = Parameters<typeof useAppWindowViews>[0];
type WindowActionsArgs = Parameters<typeof useAppWindowActions>[0];
type WindowsPropsArgs = Parameters<typeof useAppWindowsProps>[0];

interface UseAppWindowRuntimeArgs {
  actions: WindowActionsArgs;
  appReady: WindowsPropsArgs['appReady'];
  keepCombatWindowMounted: WindowsPropsArgs['keepCombatWindowMounted'];
  keepLootWindowMounted: WindowsPropsArgs['keepLootWindowMounted'];
  tooltipPositionRef: WindowsPropsArgs['tooltipPositionRef'];
  views: WindowViewsArgs;
  windows: WindowsPropsArgs['windows'];
  windowShown: WindowsPropsArgs['windowShown'];
}

export function useAppWindowRuntime({
  actions: actionArgs,
  appReady,
  keepCombatWindowMounted,
  keepLootWindowMounted,
  tooltipPositionRef,
  views: viewArgs,
  windows,
  windowShown,
}: UseAppWindowRuntimeArgs) {
  const views = useAppWindowViews(viewArgs);
  const actions = useAppWindowActions(actionArgs);

  return useAppWindowsProps({
    appReady,
    windows,
    windowShown,
    keepLootWindowMounted,
    keepCombatWindowMounted,
    tooltipPositionRef,
    views,
    actions,
  });
}
