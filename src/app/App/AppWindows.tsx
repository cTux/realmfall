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
import { getDockEntries } from './utils/getDockEntries';

export function AppWindows(props: AppWindowsProps) {
  const tooltip = useTooltipState();
  const dockEntries = useMemo(
    () =>
      getDockEntries(
        props.layout.windowShown,
        props.layout.renderLootWindow,
        props.layout.renderCombatWindow,
      ),
    [
      props.layout.renderCombatWindow,
      props.layout.renderLootWindow,
      props.layout.windowShown,
    ],
  );
  const { windowMoveHandlers, windowCloseHandlers } = useAppWindowHandlers({
    onMoveWindow: props.actions.windows.onMoveWindow,
    onSetWindowVisibility: props.actions.windows.onSetWindowVisibility,
  });
  const loadedWindows = useDeferredWindows({
    windowShown: props.layout.windowShown,
    renderLootWindow: props.layout.renderLootWindow,
    renderCombatWindow: props.layout.renderCombatWindow,
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
        tooltip={tooltip}
        windowCloseHandlers={windowCloseHandlers}
        windowMoveHandlers={windowMoveHandlers}
      />
      <AppDeferredWindows
        {...props}
        combatPlayerParty={combatPlayerParty}
        hexInfoView={hexInfoView}
        loadedWindows={loadedWindows}
        recipeWindowStructure={recipeWindowStructure}
        windowCloseHandlers={windowCloseHandlers}
        windowMoveHandlers={windowMoveHandlers}
      />
    </>
  );
}
