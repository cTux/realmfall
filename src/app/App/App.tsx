import { useRef, useState } from 'react';
import { createGame, type GameState } from '../../game/state';
import { WORLD_RADIUS } from '../constants';
import { AppWindows } from './AppWindows';
import { HomeIndicator } from './HomeIndicator';
import { useAppControllers } from './useAppControllers';
import { useAppGameView } from './useAppGameView';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { setHomeHexForApp, useAppLifecycle } from './hooks/useAppLifecycle';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import styles from './styles.module.scss';

export function App() {
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const gameRef = useRef<GameState>(initialGameRef.current);
  const tooltipPositionRef = useRef<TooltipPosition | null>(null);
  const worldTimeMsRef = useRef(initialGameRef.current.worldTimeMs);
  const worldTimeTickRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsSampleRef = useRef(0);
  const lastDisplayedWorldSecondRef = useRef(
    Math.floor(initialGameRef.current.worldTimeMs / 1000),
  );
  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const {
    closeItemMenu,
    closeTooltip,
    handleBuyTownItem,
    handleClaimHex,
    handleContextItem,
    handleCraftRecipe,
    handleDropEquippedItem,
    handleDropItem,
    handleEquipmentHover,
    handleEquip,
    handleEquippedContextItem,
    handleInteract,
    handleProspect,
    handleSellAll,
    handleSort,
    handleStartCombat,
    handleTakeAllLoot,
    handleTakeLootItem,
    handleUnequip,
    handleUseItem,
    itemMenu,
    logFilters,
    moveWindow,
    showTooltip,
    setLogFilters,
    setTooltip,
    setWindowShown,
    setWindowVisibility,
    setWindows,
    showFilterMenu,
    showItemTooltip,
    toggleDockWindow,
    toggleFilterMenu,
    toggleLogFilter,
    windowShown,
    windows,
  } = useAppControllers({
    gameRef,
    setGame,
    tooltipPositionRef,
    worldTimeMsRef,
  });
  const { setWorldTimeMs, worldTimeMinutes, worldTimeMs } = useWorldClockFps({
    initialWorldTimeMs: initialGameRef.current.worldTimeMs,
    worldTimeMsRef,
    worldTimeTickRef,
    frameCountRef,
    lastFpsSampleRef,
    lastDisplayedWorldSecondRef,
  });

  const {
    claimStatus,
    canProspect,
    canSell,
    combatEnemies,
    currentTile,
    filteredLogs,
    gold,
    interactLabel,
    inventoryCounts,
    prospectExplanation,
    recipeBookKnown,
    recipes,
    sellExplanation,
    stats,
    townStock,
  } = useAppGameView({
    game,
    logFilters,
  });
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
  const { hostRef, canvasReady } = usePixiWorld({
    game,
    worldTimeMsRef,
    frameCountRef,
    gameRef,
    tooltipPositionRef,
    setGame,
    setTooltip,
  });
  const hydrated = useAppPersistence({
    game,
    gameRef,
    logFilters,
    setGame,
    setLogFilters,
    setWindows,
    setWindowShown,
    setWorldTimeMs,
    windows,
    windowShown,
    worldTimeMsRef,
    worldTimeTickRef,
    lastDisplayedWorldSecondRef,
  });
  const isReady = hydrated && canvasReady;

  useAppLifecycle({
    game,
    gameRef,
    setGame,
    tooltipPositionRef,
    worldTimeMinutes,
    worldTimeMs,
    worldTimeMsRef,
  });

  useCombatAutomation({
    combat: game.combat,
    setGame,
    worldTimeMsRef,
  });

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
        <AppWindows
          windows={windows}
          windowShown={windowShown}
          worldTimeMs={worldTimeMs}
          stats={stats}
          game={game}
          currentTile={currentTile}
          recipeBookKnown={recipeBookKnown}
          recipes={recipes}
          inventoryCounts={inventoryCounts}
          interactLabel={interactLabel}
          canProspect={canProspect}
          canSell={canSell}
          claimStatus={claimStatus}
          prospectExplanation={prospectExplanation}
          sellExplanation={sellExplanation}
          townStock={townStock}
          gold={gold}
          renderLootWindow={renderLootWindow}
          lootWindowVisible={lootWindowVisible}
          lootSnapshot={lootSnapshot}
          renderCombatWindow={renderCombatWindow}
          combatWindowVisible={combatWindowVisible}
          combatSnapshot={combatSnapshot}
          showFilterMenu={showFilterMenu}
          logFilters={logFilters}
          filteredLogs={filteredLogs}
          tooltipPositionRef={tooltipPositionRef}
          itemMenu={itemMenu}
          onMoveWindow={moveWindow}
          onSetWindowVisibility={setWindowVisibility}
          onToggleDockWindow={toggleDockWindow}
          onShowItemTooltip={showItemTooltip}
          onShowTooltip={showTooltip}
          onCloseTooltip={closeTooltip}
          onCloseItemMenu={closeItemMenu}
          onUnequip={handleUnequip}
          onSort={handleSort}
          onEquip={handleEquip}
          onUseItem={handleUseItem}
          onCraftRecipe={handleCraftRecipe}
          onDropItem={handleDropItem}
          onDropEquippedItem={handleDropEquippedItem}
          onContextItem={handleContextItem}
          onEquippedContextItem={handleEquippedContextItem}
          onTakeLootItem={handleTakeLootItem}
          onTakeAllLoot={handleTakeAllLoot}
          onStartCombat={handleStartCombat}
          onToggleFilterMenu={toggleFilterMenu}
          onToggleLogFilter={toggleLogFilter}
          onEquipmentHover={handleEquipmentHover}
          onInteract={handleInteract}
          onProspect={handleProspect}
          onSellAll={handleSellAll}
          onBuyTownItem={handleBuyTownItem}
          onClaimHex={handleClaimHex}
          onSetHome={() => setHomeHexForApp(setGame)}
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
