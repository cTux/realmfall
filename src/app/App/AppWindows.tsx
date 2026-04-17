import { useMemo } from 'react';
import type { AppWindowsProps } from './AppWindows.types';
import { AppDeferredWindows } from './components/AppDeferredWindows';
import { AppFixedWindows } from './components/AppFixedWindows';
import { useTooltipState } from './tooltipStore';
import { useAppWindowHandlers } from './hooks/useAppWindowHandlers';
import { useCombatPlayerParty } from './hooks/useCombatPlayerParty';
import { useDeferredWindows } from './hooks/useDeferredWindows';
import { useHexInfoView } from './hooks/useHexInfoView';
import { useRecipeWindowStructure } from './hooks/useRecipeWindowStructure';
import { useManagedWindowProps } from './hooks/useManagedWindowProps';
import { getDockEntries } from './utils/getDockEntries';

export function AppWindows(props: AppWindowsProps) {
  const tooltip = useTooltipState();
  const dockEntries = useMemo(
    () =>
      getDockEntries(
        props.layout.windowShown,
        props.layout.keepLootWindowMounted,
        props.layout.keepCombatWindowMounted,
      ),
    [
      props.layout.keepCombatWindowMounted,
      props.layout.keepLootWindowMounted,
      props.layout.windowShown,
    ],
  );
  const { windowMoveHandlers, windowCloseHandlers } = useAppWindowHandlers({
    onMoveWindow: props.actions.windows.onMoveWindow,
    onSetWindowVisibility: props.actions.windows.onSetWindowVisibility,
  });
  const managedWindowProps = useManagedWindowProps({
    windows: props.layout.windows,
    windowShown: props.layout.windowShown,
    windowMoveHandlers,
    windowCloseHandlers,
  });
  const mountedWindows = useDeferredWindows({
    windowShown: props.layout.windowShown,
    keepLootWindowMounted: props.layout.keepLootWindowMounted,
    keepCombatWindowMounted: props.layout.keepCombatWindowMounted,
  });
  const hexInfoView = useHexInfoView({
    homeHex: props.views.world.homeHex,
    playerCoord: props.views.player.coord,
    currentTile: props.views.world.currentTile,
    currentTileHostileEnemyCount: props.views.world.currentTileHostileEnemyCount,
    combat: props.views.world.combat,
    combatSnapshot: props.views.combat.snapshot,
  });
  const recipeWindowStructure = useRecipeWindowStructure(
    props.views.world.currentTile.structure,
  );
  const combatPlayerParty = useCombatPlayerParty({
    combatSnapshot: props.views.combat.snapshot,
    stats: props.views.hero.stats,
    mana: props.views.player.mana,
  });

  return (
    <>
      <AppFixedWindows
        {...props}
        dockEntries={dockEntries}
        managedWindowProps={managedWindowProps}
        tooltip={tooltip}
      />
      <AppDeferredWindows
        {...props}
        combatPlayerParty={combatPlayerParty}
        hexInfoView={hexInfoView}
        mountedWindows={mountedWindows}
        managedWindowProps={managedWindowProps}
        recipeWindowStructure={recipeWindowStructure}
      />
    </>
  );
}
