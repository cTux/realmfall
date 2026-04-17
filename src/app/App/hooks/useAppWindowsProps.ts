import { useMemo } from 'react';
import type { AppWindowsProps } from '../AppWindows.types';
import { t } from '../../../i18n';

type RawClaimStatus = ReturnType<
  typeof import('../../../game/state').getCurrentHexClaimStatus
>;

interface UseAppWindowsPropsArgs {
  windows: AppWindowsProps['layout']['windows'];
  windowShown: AppWindowsProps['layout']['windowShown'];
  keepLootWindowMounted: AppWindowsProps['layout']['keepLootWindowMounted'];
  keepCombatWindowMounted: AppWindowsProps['layout']['keepCombatWindowMounted'];
  tooltipPositionRef: AppWindowsProps['layout']['tooltipPositionRef'];
  heroView: AppWindowsProps['views']['hero'];
  playerView: AppWindowsProps['views']['player'];
  worldView: Omit<AppWindowsProps['views']['world'], 'claimStatus'> & {
    claimStatus: RawClaimStatus;
  };
  recipesView: AppWindowsProps['views']['recipes'];
  lootView: AppWindowsProps['views']['loot'];
  combatView: AppWindowsProps['views']['combat'];
  logsView: AppWindowsProps['views']['logs'];
  settingsView: AppWindowsProps['views']['settings'];
  itemMenu: AppWindowsProps['views']['itemMenu'];
  actions: AppWindowsProps['actions'];
}

export function useAppWindowsProps({
  windows,
  windowShown,
  keepLootWindowMounted,
  keepCombatWindowMounted,
  tooltipPositionRef,
  heroView,
  playerView,
  worldView,
  recipesView,
  lootView,
  combatView,
  logsView,
  settingsView,
  itemMenu,
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
      ...worldView,
      claimStatus: addClaimStatusActionLabel(worldView.claimStatus),
    }),
    [worldView],
  );

  const views = useMemo(
    () => ({
      hero: heroView,
      player: playerView,
      world,
      recipes: recipesView,
      loot: lootView,
      combat: combatView,
      logs: logsView,
      settings: settingsView,
      itemMenu,
    }),
    [
      combatView,
      heroView,
      itemMenu,
      logsView,
      lootView,
      playerView,
      recipesView,
      settingsView,
      world,
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
  claimStatus: RawClaimStatus,
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
