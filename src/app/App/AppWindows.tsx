import { useMemo } from 'react';
import type { AppWindowsProps } from './AppWindows.types';
import { AppDeferredWindows } from './components/AppDeferredWindows';
import { AppFixedWindows } from './components/AppFixedWindows';
import { useMountedWindows } from './hooks/useMountedWindows';
import { useAppWindowHandlers } from './hooks/useAppWindowHandlers';
import { useCombatPlayerParty } from './hooks/useCombatPlayerParty';
import { useHexInfoView } from './hooks/useHexInfoView';
import { useRecipeWindowStructure } from './hooks/useRecipeWindowStructure';
import { useManagedWindowProps } from './hooks/useManagedWindowProps';
import { getDockEntries } from './utils/getDockEntries';

export function AppWindows(props: AppWindowsProps) {
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
  const mountedWindows = useMountedWindows({
    windowShown: props.layout.windowShown,
    keepLootWindowMounted: props.layout.keepLootWindowMounted,
    keepCombatWindowMounted: props.layout.keepCombatWindowMounted,
  });
  const hexInfoView = useHexInfoView({
    homeHex: props.views.world.homeHex,
    playerCoord: props.views.player.coord,
    currentTile: props.views.world.currentTile,
    currentTileHostileEnemyCount:
      props.views.world.currentTileHostileEnemyCount,
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
        dockEntries={dockEntries}
        managedWindowProps={managedWindowProps}
        tooltipPositionRef={props.layout.tooltipPositionRef}
        heroView={props.views.hero}
        playerView={props.views.player}
        itemMenu={props.views.itemMenu}
        windowActions={props.actions.windows}
        tooltipActions={props.actions.tooltip}
        inventoryActions={props.actions.inventory}
        recipeActions={props.actions.recipes}
      />
      <AppDeferredWindows
        combatPlayerParty={combatPlayerParty}
        hexInfoView={hexInfoView}
        mountedWindows={mountedWindows}
        managedWindowProps={managedWindowProps}
        recipeWindowStructure={recipeWindowStructure}
        heroStats={props.views.hero.stats}
        playerView={props.views.player}
        worldView={props.views.world}
        recipesView={props.views.recipes}
        lootView={props.views.loot}
        combatView={props.views.combat}
        logsView={props.views.logs}
        settingsView={props.views.settings}
        tooltipActions={props.actions.tooltip}
        inventoryActions={props.actions.inventory}
        worldActions={props.actions.world}
        recipeActions={props.actions.recipes}
        logActions={props.actions.logs}
        settingsActions={props.actions.settings}
      />
    </>
  );
}
