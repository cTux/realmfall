import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { GameState } from '../../game/state';
import { AppWindows } from './AppWindows';
import { getDockEntries } from './appHelpers';
import { HomeIndicator } from './HomeIndicator';
import { DebuggerWindow } from '../../ui/components/DebuggerWindow';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { resetTooltipState } from './tooltipStore';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { gameActions } from '../store/gameSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectWindowShown,
  selectWindows,
} from '../store/selectors/uiSelectors';
import { useGameState } from '../store/useGameState';
import styles from './styles.module.scss';

export function App() {
  const dispatch = useAppDispatch();
  const game = useGameState();
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const gameRef = useRef<GameState>(game);
  const tooltipPositionRef = useRef<TooltipPosition | null>(null);
  const worldTimeMsRef = useRef(game.worldTimeMs);
  const worldTimeTickRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsSampleRef = useRef(0);
  const lastDisplayedWorldSecondRef = useRef(
    Math.floor(game.worldTimeMs / 1000),
  );

  const {
    closeTooltip,
    handleInteract,
    handleStartCombat,
    handleTakeAllLoot,
    logFilters,
    moveWindow,
    setTooltip,
    setWindowVisibility,
    showItemTooltip,
    showTooltip,
    toggleDockWindow,
  } = useAppControllers({
    gameRef,
    tooltipPositionRef,
    worldTimeMsRef,
  });

  const { setWorldTimeMs, worldTimeMinutes, worldTimeMs } = useWorldClockFps({
    initialWorldTimeMs: game.worldTimeMs,
    worldTimeMsRef,
    worldTimeTickRef,
    frameCountRef,
    lastFpsSampleRef,
    lastDisplayedWorldSecondRef,
  });

  const { combatEnemies, currentTile, interactLabel } = useAppGameView();

  const {
    combatSnapshot,
    combatWindowVisible,
    lootSnapshot,
    lootWindowVisible,
    renderCombatWindow,
    renderLootWindow,
  } = useWindowTransitions({
    combat: game.combat,
    combatEnemies,
    currentTile,
  });

  const handleMoveAlongSafePath = useCallback(
    (target: GameState['player']['coord']) => {
      dispatch(
        gameActions.moveAlongSafePathAtTime({
          target,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch],
  );

  const handleMoveToTile = useCallback(
    (target: GameState['player']['coord']) => {
      dispatch(
        gameActions.moveToTileAtTime({
          target,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    },
    [dispatch],
  );

  const { hostRef, canvasReady } = usePixiWorld({
    game,
    worldTimeMsRef,
    frameCountRef,
    gameRef,
    tooltipPositionRef,
    moveAlongSafePath: handleMoveAlongSafePath,
    moveToTile: handleMoveToTile,
    setTooltip,
  });

  const hydrated = useAppPersistence({
    game,
    logFilters,
    setWorldTimeMs,
    windows,
    windowShown,
    worldTimeMsRef,
    worldTimeTickRef,
    lastDisplayedWorldSecondRef,
  });
  const isReady = hydrated && canvasReady;

  useEffect(() => {
    resetTooltipState();
    tooltipPositionRef.current = null;

    return () => {
      resetTooltipState();
      tooltipPositionRef.current = null;
    };
  }, []);

  useEffect(() => {
    dispatch(
      gameActions.syncBloodMoonAtTime({
        worldTimeMinutes,
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMinutes]);

  useEffect(() => {
    dispatch(
      gameActions.syncPlayerStatusEffectsAtTime({
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, [dispatch, worldTimeMs]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useCombatAutomation({
    combat: game.combat,
    worldTimeMsRef,
  });

  const dockEntries = useMemo(
    () => getDockEntries(windowShown, renderLootWindow, renderCombatWindow),
    [renderCombatWindow, renderLootWindow, windowShown],
  );

  useKeyboardShortcuts({
    combatStartAvailable: Boolean(game.combat && !game.combat.started),
    interactLabel,
    lootSnapshotLength: lootSnapshot.length,
    lootWindowVisible,
    onStartCombat: handleStartCombat,
    renderLootWindow,
    onInteract: handleInteract,
    onTakeAllLoot: handleTakeAllLoot,
    onToggleDockWindow: toggleDockWindow,
    windowShownLoot: windowShown.loot,
  });

  return (
    <div className={styles.appRoot}>
      <div className={isReady ? undefined : styles.hiddenUntilReady}>
        <div ref={hostRef} className={styles.mapViewport} />
        <HomeIndicator
          hostRef={hostRef}
          homeHex={game.homeHex}
          playerCoord={game.player.coord}
          radius={game.radius}
        />
        {windowShown.worldTime ? (
          <DebuggerWindow
            position={windows.worldTime}
            onMove={(position) => moveWindow('worldTime', position)}
            onClose={() => setWindowVisibility('worldTime', false)}
            worldTimeMs={worldTimeMs}
            onHoverDetail={showTooltip}
            onLeaveDetail={closeTooltip}
          />
        ) : null}
        <AppWindows
          windows={windows}
          windowShown={windowShown}
          dockEntries={dockEntries}
          renderLootWindow={renderLootWindow}
          lootWindowVisible={lootWindowVisible}
          lootSnapshot={lootSnapshot}
          renderCombatWindow={renderCombatWindow}
          combatWindowVisible={combatWindowVisible}
          combatSnapshot={combatSnapshot}
          tooltipPositionRef={tooltipPositionRef}
          onToggleDockWindow={toggleDockWindow}
          onShowItemTooltip={showItemTooltip}
          onShowTooltip={showTooltip}
          onCloseTooltip={closeTooltip}
        />
      </div>
      {isReady ? null : (
        <div
          className={styles.loadingScreen}
          aria-live="polite"
          aria-busy="true"
        >
          <div className={styles.loadingSpinner} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
