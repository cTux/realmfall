import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createGame,
  getCurrentTile,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getRecipeBookRecipes,
  getTownStock,
  getVisibleTiles,
  hasEquippableInventoryItems,
  hasRecipeBook,
  structureActionLabel,
  syncBloodMoon,
  type GameState,
  type HexCoord,
} from '../../game/state';
import { WORLD_RADIUS } from '../constants';
import { DraggableWindow } from '../../ui/components/DraggableWindow';
import {
  WINDOW_LABELS,
  renderWindowLabel,
} from '../../ui/components/windowLabels';
import labelStyles from '../../ui/components/windowLabels.module.css';
import { AppWindows } from './AppWindows';
import { getDockEntries } from './appHelpers';
import { useAppControllers } from './useAppControllers';
import { useAppPersistence } from './useAppPersistence';
import { useCombatAutomation } from './useCombatAutomation';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePixiWorld } from './usePixiWorld';
import { useWindowTransitions } from './useWindowTransitions';
import { useWorldClockFps } from './useWorldClockFps';
import styles from './styles.module.css';

export function App() {
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const playerCoordRef = useRef<HexCoord>({ q: 0, r: 0 });
  const gameRef = useRef<GameState>(initialGameRef.current);
  const visibleTilesRef = useRef(getVisibleTiles(initialGameRef.current));
  const selectedRef = useRef<HexCoord>(initialGameRef.current.player.coord);
  const hoveredMoveRef = useRef<HexCoord | null>(null);
  const worldTimeMsRef = useRef(initialGameRef.current.worldTimeMs);
  const worldTimeTickRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsSampleRef = useRef(0);
  const lastDisplayedWorldSecondRef = useRef(
    Math.floor(initialGameRef.current.worldTimeMs / 1000),
  );

  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const [selected, setSelected] = useState<HexCoord>(game.player.coord);
  const [hoveredMove, setHoveredMove] = useState<HexCoord | null>(null);

  const {
    closeItemMenu,
    closeTooltip,
    handleAttackEnemy,
    handleBuyTownItem,
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
    handleTakeAllLoot,
    handleTakeLootItem,
    handleUnequip,
    handleUseItem,
    itemMenu,
    logFilters,
    moveWindow,
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
    tooltip,
    windowShown,
    windows,
  } = useAppControllers({ gameRef, setGame, worldTimeMsRef });

  const { fps, setWorldTimeMs, worldTimeLabel, worldTimeMinutes } =
    useWorldClockFps({
      initialWorldTimeMs: initialGameRef.current.worldTimeMs,
      worldTimeMsRef,
      worldTimeTickRef,
      frameCountRef,
      lastFpsSampleRef,
      lastDisplayedWorldSecondRef,
    });

  const stats = useMemo(() => getPlayerStats(game.player), [game.player]);
  const visibleTiles = useMemo(() => getVisibleTiles(game), [game]);
  const currentTile = useMemo(() => getCurrentTile(game), [game]);
  const recipeBookKnown = useMemo(
    () => hasRecipeBook(game.player.inventory),
    [game.player.inventory],
  );
  const recipes = useMemo(
    () => getRecipeBookRecipes(game.player.learnedRecipeIds),
    [game.player.learnedRecipeIds],
  );
  const inventoryCounts = useMemo(
    () =>
      game.player.inventory.reduce<Record<string, number>>((counts, item) => {
        counts[item.name] = (counts[item.name] ?? 0) + item.quantity;
        return counts;
      }, {}),
    [game.player.inventory],
  );
  const hasEquippableItems = useMemo(
    () => hasEquippableInventoryItems(game),
    [game],
  );
  const canProspect = currentTile.structure === 'forge' && hasEquippableItems;
  const canSell = currentTile.structure === 'town' && hasEquippableItems;
  const prospectExplanation =
    currentTile.structure === 'forge' && !hasEquippableItems
      ? 'Nothing in your pack can be prospected.'
      : null;
  const sellExplanation =
    currentTile.structure === 'town' && !hasEquippableItems
      ? 'No equippable items to sell.'
      : null;
  const interactLabel = structureActionLabel(currentTile.structure);
  const townStock = useMemo(() => getTownStock(game), [game]);
  const gold = useMemo(
    () => getGoldAmount(game.player.inventory),
    [game.player.inventory],
  );
  const combatEnemies = useMemo(
    () => (game.combat ? getEnemiesAt(game, game.combat.coord) : []),
    [game],
  );
  const filteredLogs = useMemo(
    () => game.logs.filter((entry) => logFilters[entry.kind]),
    [game.logs, logFilters],
  );

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
    visibleTiles,
    selected,
    hoveredMove,
    worldTimeMsRef,
    frameCountRef,
    playerCoordRef,
    gameRef,
    visibleTilesRef,
    selectedRef,
    hoveredMoveRef,
    setGame,
    setSelected,
    setHoveredMove,
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

  useEffect(() => {
    setGame((current) =>
      syncBloodMoon(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        worldTimeMinutes,
      ),
    );
  }, [worldTimeMinutes]);

  useEffect(() => {
    playerCoordRef.current = game.player.coord;
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    visibleTilesRef.current = visibleTiles;
  }, [visibleTiles]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    hoveredMoveRef.current = hoveredMove;
  }, [hoveredMove]);

  useCombatAutomation({
    combat: game.combat,
    combatEnemyCount: combatEnemies.length,
    setGame,
    worldTimeMsRef,
  });

  useEffect(() => {
    setSelected(game.player.coord);
    setHoveredMove(null);
  }, [game.player.coord]);

  const dockEntries = useMemo(
    () => getDockEntries(windowShown, renderLootWindow, renderCombatWindow),
    [renderCombatWindow, renderLootWindow, windowShown],
  );

  useKeyboardShortcuts({
    interactLabel,
    lootSnapshotLength: lootSnapshot.length,
    lootWindowVisible,
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
        {windowShown.worldTime ? (
          <DraggableWindow
            title={renderWindowLabel(
              WINDOW_LABELS.worldTime,
              labelStyles.hotkey,
            )}
            position={windows.worldTime}
            onMove={(position) => moveWindow('worldTime', position)}
            onClose={() => setWindowVisibility('worldTime', false)}
            className={styles.worldClockWindow}
          >
            <div className={styles.worldClock} aria-label="World time">
              <div className={styles.worldClockMetric}>
                <span className={styles.worldClockLabel}>World Time</span>
                <strong className={styles.worldClockValue}>
                  {worldTimeLabel}
                </strong>
              </div>
              <div className={styles.worldClockMetric}>
                <span className={styles.worldClockLabel}>FPS</span>
                <strong className={styles.worldClockValue}>{fps}</strong>
              </div>
            </div>
          </DraggableWindow>
        ) : null}
        <AppWindows
          windows={windows}
          windowShown={windowShown}
          dockEntries={dockEntries}
          stats={stats}
          game={game}
          currentTile={currentTile}
          recipeBookKnown={recipeBookKnown}
          recipes={recipes}
          inventoryCounts={inventoryCounts}
          interactLabel={interactLabel}
          canProspect={canProspect}
          canSell={canSell}
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
          tooltip={tooltip}
          itemMenu={itemMenu}
          onMoveWindow={moveWindow}
          onSetWindowVisibility={setWindowVisibility}
          onToggleDockWindow={toggleDockWindow}
          onShowItemTooltip={showItemTooltip}
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
          onAttackEnemy={handleAttackEnemy}
          onToggleFilterMenu={toggleFilterMenu}
          onToggleLogFilter={toggleLogFilter}
          onEquipmentHover={handleEquipmentHover}
          onInteract={handleInteract}
          onProspect={handleProspect}
          onSellAll={handleSellAll}
          onBuyTownItem={handleBuyTownItem}
        />
      </div>
      {isReady ? null : <div className={styles.loadingScreen}>Loading...</div>}
    </div>
  );
}
