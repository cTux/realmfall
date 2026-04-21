import { useMemo } from 'react';
import type {
  AppWindowsActions,
  AppWindowsProps,
  AppWindowsRawViewState,
} from '../AppWindows.types';
import { t } from '../../../i18n';

interface UseAppWindowsPropsArgs {
  windows: AppWindowsProps['layout']['windows'];
  windowShown: AppWindowsProps['layout']['windowShown'];
  keepLootWindowMounted: AppWindowsProps['layout']['keepLootWindowMounted'];
  keepCombatWindowMounted: AppWindowsProps['layout']['keepCombatWindowMounted'];
  tooltipPositionRef: AppWindowsProps['layout']['tooltipPositionRef'];
  views: AppWindowsRawViewState;
  actions: AppWindowsActions;
}

export function useAppWindowsProps({
  windows,
  windowShown,
  keepLootWindowMounted,
  keepCombatWindowMounted,
  tooltipPositionRef,
  views: rawViews,
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

  const world = useMemo(
    () => ({
      ...rawViews.world,
      claimStatus: addClaimStatusActionLabel(rawViews.world.claimStatus),
    }),
    [rawViews.world],
  );

  const views = useMemo(
    () => ({
      hero: rawViews.hero,
      player: rawViews.player,
      world,
      recipes: rawViews.recipes,
      loot: rawViews.loot,
      combat: rawViews.combat,
      logs: rawViews.logs,
      settings: rawViews.settings,
      itemMenu: rawViews.itemMenu,
    }),
    [
      world,
      rawViews.combat,
      rawViews.hero,
      rawViews.itemMenu,
      rawViews.logs,
      rawViews.loot,
      rawViews.player,
      rawViews.recipes,
      rawViews.settings,
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

function addClaimStatusActionLabel(
  claimStatus: AppWindowsRawViewState['world']['claimStatus'],
): AppWindowsProps['views']['world']['claimStatus'] {
  switch (claimStatus.action) {
    case 'unclaim':
      return {
        ...claimStatus,
        actionLabel: t('ui.hexInfo.unclaimAction'),
      };
    case 'claim':
      return {
        ...claimStatus,
        actionLabel: t('ui.hexInfo.claimAction'),
      };
    default:
      return {
        ...claimStatus,
        actionLabel: t('ui.hexInfo.claimAction'),
      };
  }
}
