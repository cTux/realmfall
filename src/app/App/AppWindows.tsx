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
        props.windowShown,
        props.renderLootWindow,
        props.renderCombatWindow,
      ),
    [props.renderCombatWindow, props.renderLootWindow, props.windowShown],
  );
  const { windowMoveHandlers, windowCloseHandlers } = useAppWindowHandlers({
    onMoveWindow: props.onMoveWindow,
    onSetWindowVisibility: props.onSetWindowVisibility,
  });
  const loadedWindows = useDeferredWindows({
    windowShown: props.windowShown,
    renderLootWindow: props.renderLootWindow,
    renderCombatWindow: props.renderCombatWindow,
  });
  const hexInfoView = useHexInfoView({
    game: props.game,
    currentTile: props.currentTile,
    combatSnapshot: props.combatSnapshot,
  });
  const recipeWindowStructure = useRecipeWindowStructure(
    props.currentTile.structure,
  );
  const combatPlayerParty = useCombatPlayerParty({
    combatSnapshot: props.combatSnapshot,
    stats: props.stats,
    mana: props.game.player.mana,
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
