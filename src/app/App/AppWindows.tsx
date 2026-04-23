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
  const dockAttention = useMemo(
    () => ({
      hexInfo: Boolean(
        props.views.hex.combat && !props.views.hex.combat.started,
      ),
    }),
    [props.views.hex.combat],
  );
  const dockEntries = useMemo(
    () => getDockEntries(props.layout.windowShown, dockAttention),
    [dockAttention, props.layout.windowShown],
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
    homeHex: props.views.hex.homeHex,
    playerCoord: props.views.player.coord,
    currentTile: props.views.hex.currentTile,
    currentTileHostileEnemyCount: props.views.hex.currentTileHostileEnemyCount,
    combat: props.views.hex.combat,
    combatSnapshot: props.views.combat.snapshot,
  });
  const recipeWindowStructure = useRecipeWindowStructure(
    props.views.hex.currentTile.structure,
  );
  const combatPlayerParty = useCombatPlayerParty({
    combatSnapshot: props.views.combat.snapshot,
    heroOverview: props.views.hero.overview,
    mana: props.views.player.mana,
  });
  const deferredWindowViews = useMemo(
    () => ({
      hero: props.views.hero,
      inventory: props.views.inventory,
      hex: props.views.hex,
      recipes: props.views.recipes,
      combat: props.views.combat,
      logs: props.views.logs,
      settings: props.views.settings,
    }),
    [
      props.views.combat,
      props.views.hero,
      props.views.hex,
      props.views.inventory,
      props.views.logs,
      props.views.recipes,
      props.views.settings,
    ],
  );
  const deferredWindowActions = useMemo(
    () => ({
      tooltip: props.actions.tooltip,
      inventory: props.actions.inventory,
      hex: props.actions.hex,
      recipes: props.actions.recipes,
      logs: props.actions.logs,
      settings: props.actions.settings,
    }),
    [
      props.actions.hex,
      props.actions.inventory,
      props.actions.logs,
      props.actions.recipes,
      props.actions.settings,
      props.actions.tooltip,
    ],
  );

  return (
    <>
      <AppFixedWindows
        dockEntries={dockEntries}
        managedWindowProps={managedWindowProps}
        tooltipPositionRef={props.layout.tooltipPositionRef}
        heroView={props.views.hero}
        inventoryView={props.views.inventory}
        itemMenu={props.views.itemMenu}
        windowActions={props.actions.windows}
        tooltipActions={props.actions.tooltip}
        inventoryActions={props.actions.inventory}
        recipeActions={props.actions.recipes}
      />
      <AppDeferredWindows
        appReady={props.layout.appReady}
        combatPlayerParty={combatPlayerParty}
        hexInfoView={hexInfoView}
        mountedWindows={mountedWindows}
        managedWindowProps={managedWindowProps}
        recipeWindowStructure={recipeWindowStructure}
        views={deferredWindowViews}
        actions={deferredWindowActions}
      />
    </>
  );
}
