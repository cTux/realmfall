import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  attackCombatEnemy,
  buyTownItem,
  craftRecipe,
  createGame,
  createFreshLogs,
  dropEquippedItem,
  dropInventoryItem,
  equipItem,
  getCurrentTile,
  hasEquippableInventoryItems,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getRecipeBookRecipes,
  getTownStock,
  getVisibleTiles,
  hasRecipeBook,
  interactWithStructure,
  prospectInventory,
  sellAllItems,
  structureActionLabel,
  takeAllTileItems,
  takeTileItem,
  sortInventory,
  syncBloodMoon,
  unequipItem,
  useItem as applyItemUse,
  type GameState,
  type HexCoord,
  type LogKind,
} from '../../game/state';
import {
  DEFAULT_WINDOW_VISIBILITY,
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  type WindowVisibilityState,
  WORLD_RADIUS,
  type WindowPositions,
} from '../constants';
import { normalizeLoadedGame } from '../normalize';
import {
  loadEncryptedState,
  saveEncryptedState,
} from '../../persistence/storage';
import { itemTooltipLines } from '../../ui/tooltips';
import { rarityColor } from '../../ui/rarity';
import {
  formatWorldTime,
  getWorldTimeMinutesFromTimestamp,
} from '../../ui/world/timeOfDay';
import type {
  ItemContextMenuState,
  PersistedUiState,
  TooltipItem,
  TooltipState,
} from './types';
import { AppWindows } from './AppWindows';
import {
  getDockEntries,
  getInventoryItemAction,
  isEditableTarget,
  WINDOW_HOTKEYS,
} from './appHelpers';
import { usePixiWorld } from './usePixiWorld';
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
  const lastDisplayedWorldMinuteRef = useRef(
    Math.floor(
      getWorldTimeMinutesFromTimestamp(initialGameRef.current.worldTimeMs),
    ),
  );
  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const [selected, setSelected] = useState<HexCoord>(game.player.coord);
  const [hoveredMove, setHoveredMove] = useState<HexCoord | null>(null);
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowShown, setWindowShown] = useState<WindowVisibilityState>(
    DEFAULT_WINDOW_VISIBILITY,
  );
  const [logFilters, setLogFilters] = useState(DEFAULT_LOG_FILTERS);
  const [hydrated, setHydrated] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);
  const [worldTimeMs, setWorldTimeMs] = useState(
    initialGameRef.current.worldTimeMs,
  );
  const [fps, setFps] = useState(0);

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
  const lootWindowKey = useMemo(() => {
    if (currentTile.items.length === 0) return null;
    return `${currentTile.coord.q},${currentTile.coord.r}:${currentTile.items.map((item) => `${item.id}:${item.quantity}`).join('|')}`;
  }, [currentTile]);
  const showLootWindow = Boolean(!game.combat && lootWindowKey);
  const [renderLootWindow, setRenderLootWindow] = useState(showLootWindow);
  const [lootWindowVisible, setLootWindowVisible] = useState(showLootWindow);
  const [lootSnapshot, setLootSnapshot] = useState(currentTile.items);
  const filteredLogs = useMemo(
    () => game.logs.filter((entry) => logFilters[entry.kind]),
    [game.logs, logFilters],
  );
  const worldTimeMinutes = useMemo(
    () => getWorldTimeMinutesFromTimestamp(worldTimeMs),
    [worldTimeMs],
  );
  const worldTimeLabel = useMemo(
    () => formatWorldTime(worldTimeMinutes),
    [worldTimeMinutes],
  );

  useEffect(() => {
    setGame((current) =>
      syncBloodMoon(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        worldTimeMinutes,
      ),
    );
  }, [worldTimeMinutes]);

  const [renderCombatWindow, setRenderCombatWindow] = useState(
    Boolean(game.combat),
  );
  const [combatWindowVisible, setCombatWindowVisible] = useState(
    Boolean(game.combat),
  );
  const [combatSnapshot, setCombatSnapshot] = useState<{
    combat: NonNullable<GameState['combat']>;
    enemies: typeof combatEnemies;
  } | null>(
    game.combat ? { combat: game.combat, enemies: combatEnemies } : null,
  );

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
  const isReady = hydrated && canvasReady;

  useEffect(() => {
    playerCoordRef.current = game.player.coord;
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    visibleTilesRef.current = visibleTiles;
  }, [visibleTiles]);

  useEffect(() => {
    let frameId = 0;

    const updateHud = (timestamp: number) => {
      const lastTick = worldTimeTickRef.current;
      if (lastTick != null) {
        worldTimeMsRef.current += timestamp - lastTick;
      }
      worldTimeMsRef.current %= 60 * 1000;
      worldTimeTickRef.current = timestamp;

      const displayedWorldMinute = Math.floor(
        getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
      );
      if (displayedWorldMinute !== lastDisplayedWorldMinuteRef.current) {
        lastDisplayedWorldMinuteRef.current = displayedWorldMinute;
        setWorldTimeMs(worldTimeMsRef.current);
      }

      if (lastFpsSampleRef.current === 0) {
        lastFpsSampleRef.current = timestamp;
      }

      const elapsed = timestamp - lastFpsSampleRef.current;
      if (elapsed >= 250) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFpsSampleRef.current = timestamp;
      }

      frameId = window.requestAnimationFrame(updateHud);
    };

    frameId = window.requestAnimationFrame(updateHud);
    return () => {
      worldTimeTickRef.current = null;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    hoveredMoveRef.current = hoveredMove;
  }, [hoveredMove]);

  useEffect(() => {
    if (!game.combat || combatEnemies.length === 0) return;

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        const enemyId = current.combat?.enemyIds[0];
        return enemyId
          ? attackCombatEnemy(
              { ...current, worldTimeMs: worldTimeMsRef.current },
              enemyId,
            )
          : current;
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [combatEnemies, game.combat]);

  useEffect(() => {
    if (showLootWindow) {
      setLootSnapshot(currentTile.items);
      setRenderLootWindow(true);
      const frame = window.requestAnimationFrame(() =>
        setLootWindowVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setLootWindowVisible(false);
    const timeout = window.setTimeout(() => setRenderLootWindow(false), 180);
    return () => window.clearTimeout(timeout);
  }, [currentTile.items, showLootWindow]);

  useEffect(() => {
    if (game.combat) {
      setCombatSnapshot({ combat: game.combat, enemies: combatEnemies });
      setRenderCombatWindow(true);
      const frame = window.requestAnimationFrame(() =>
        setCombatWindowVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setCombatWindowVisible(false);
    const timeout = window.setTimeout(() => setRenderCombatWindow(false), 180);
    return () => window.clearTimeout(timeout);
  }, [combatEnemies, game.combat]);

  useEffect(() => {
    let alive = true;

    void loadEncryptedState().then((saved) => {
      if (!alive) return;
      if (saved?.game) {
        const loadedGame = normalizeLoadedGame(saved.game as GameState);
        worldTimeMsRef.current = loadedGame.worldTimeMs;
        worldTimeTickRef.current = null;
        lastDisplayedWorldMinuteRef.current = Math.floor(
          getWorldTimeMinutesFromTimestamp(loadedGame.worldTimeMs),
        );
        setWorldTimeMs(loadedGame.worldTimeMs);
        setGame({
          ...loadedGame,
          logSequence: 3,
          logs: createFreshLogs(loadedGame.seed),
        });
      }
      if (saved?.ui) {
        const ui = saved.ui as {
          windows?: WindowPositions;
          windowShown?: WindowVisibilityState;
          windowCollapsed?: Partial<WindowVisibilityState>;
        } & PersistedUiState;
        if (ui.windows) setWindows({ ...DEFAULT_WINDOWS, ...ui.windows });
        if (ui.windowShown) {
          setWindowShown({
            ...DEFAULT_WINDOW_VISIBILITY,
            ...ui.windowShown,
          });
        } else if (ui.windowCollapsed) {
          setWindowShown({
            ...DEFAULT_WINDOW_VISIBILITY,
            ...Object.fromEntries(
              Object.entries(ui.windowCollapsed).map(([key, collapsed]) => [
                key,
                !collapsed,
              ]),
            ),
          } as WindowVisibilityState);
        }
        if (ui.logFilters) {
          setLogFilters({ ...DEFAULT_LOG_FILTERS, ...ui.logFilters });
        }
      }
      setHydrated(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveEncryptedState({
      game: { ...game, worldTimeMs: worldTimeMsRef.current, logs: [] },
      ui: { windows, windowShown, logFilters },
    });
  }, [game, hydrated, logFilters, windowShown, windows]);

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => {
      void saveEncryptedState({
        game: {
          ...gameRef.current,
          worldTimeMs: worldTimeMsRef.current,
          logs: [],
        },
        ui: { windows, windowShown, logFilters },
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [hydrated, logFilters, windowShown, windows]);

  useEffect(() => {
    setSelected(game.player.coord);
    setHoveredMove(null);
  }, [game.player.coord]);

  const moveWindow = useCallback(
    (
      key: keyof WindowPositions,
      position: WindowPositions[keyof WindowPositions],
    ) => {
      setWindows((current) => ({ ...current, [key]: position }));
    },
    [],
  );

  const setWindowVisibility = useCallback(
    (key: keyof WindowVisibilityState, shown: boolean) => {
      setWindowShown((current) => ({ ...current, [key]: shown }));
    },
    [],
  );

  const closeTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const closeItemMenu = useCallback(() => {
    setItemMenu(null);
  }, []);

  const showItemTooltip = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      equipped?: TooltipItem,
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        title: item.name,
        lines: itemTooltipLines(item, equipped),
        x: rect.right + 12,
        y: rect.top,
        borderColor: rarityColor(item.rarity),
      });
    },
    [],
  );

  const handleUnequip = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      setGame((current) =>
        unequipItem({ ...current, worldTimeMs: worldTimeMsRef.current }, slot),
      );
    },
    [],
  );

  const handleSort = useCallback(() => {
    setGame((current) =>
      sortInventory({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, []);

  const handleProspect = useCallback(() => {
    setGame((current) =>
      prospectInventory({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, []);

  const handleSellAll = useCallback(() => {
    setGame((current) =>
      sellAllItems({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, []);

  const handleInteract = useCallback(() => {
    setGame((current) =>
      interactWithStructure({
        ...current,
        worldTimeMs: worldTimeMsRef.current,
      }),
    );
  }, []);

  const handleBuyTownItem = useCallback((itemId: string) => {
    setGame((current) =>
      buyTownItem({ ...current, worldTimeMs: worldTimeMsRef.current }, itemId),
    );
  }, []);

  const handleEquip = useCallback(
    (itemId: string) => {
      const item = gameRef.current.player.inventory.find(
        (entry) => entry.id === itemId,
      );
      const action = getInventoryItemAction(item);
      if (action === 'open-recipes') {
        setWindowVisibility('recipes', true);
        return;
      }
      if (action === 'use') {
        setGame((current) =>
          applyItemUse(
            { ...current, worldTimeMs: worldTimeMsRef.current },
            itemId,
          ),
        );
        return;
      }
      setGame((current) =>
        equipItem({ ...current, worldTimeMs: worldTimeMsRef.current }, itemId),
      );
    },
    [setWindowVisibility],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      const item = gameRef.current.player.inventory.find(
        (entry) => entry.id === itemId,
      );
      if (getInventoryItemAction(item) === 'open-recipes') {
        setWindowVisibility('recipes', true);
        return;
      }
      setGame((current) =>
        applyItemUse(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          itemId,
        ),
      );
    },
    [setWindowVisibility],
  );

  const handleCraftRecipe = useCallback((recipeId: string) => {
    setGame((current) =>
      craftRecipe(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        recipeId,
      ),
    );
  }, []);

  const handleDropItem = useCallback((itemId: string) => {
    setGame((current) =>
      dropInventoryItem(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        itemId,
      ),
    );
  }, []);

  const handleDropEquippedItem = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      setGame((current) =>
        dropEquippedItem(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          slot,
        ),
      );
    },
    [],
  );

  const handleContextItem = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      event.preventDefault();
      setItemMenu({ item, x: event.clientX, y: event.clientY });
    },
    [],
  );

  const handleEquippedContextItem = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      slot: Parameters<typeof unequipItem>[1],
    ) => {
      event.preventDefault();
      setItemMenu({ item, x: event.clientX, y: event.clientY, slot });
    },
    [],
  );

  const handleTakeLootItem = useCallback((itemId: string) => {
    setGame((current) =>
      takeTileItem({ ...current, worldTimeMs: worldTimeMsRef.current }, itemId),
    );
  }, []);

  const handleTakeAllLoot = useCallback(() => {
    setGame((current) =>
      takeAllTileItems({ ...current, worldTimeMs: worldTimeMsRef.current }),
    );
  }, []);

  const handleAttackEnemy = useCallback((enemyId: string) => {
    setGame((current) =>
      attackCombatEnemy(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        enemyId,
      ),
    );
  }, []);

  const toggleFilterMenu = useCallback(() => {
    setShowFilterMenu((current) => !current);
  }, []);

  const toggleLogFilter = useCallback((kind: LogKind) => {
    setLogFilters((current) => ({ ...current, [kind]: !current[kind] }));
  }, []);

  const handleEquipmentHover = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      showItemTooltip(event, item);
    },
    [showItemTooltip],
  );

  const dockEntries = useMemo(
    () => getDockEntries(windowShown, renderLootWindow, renderCombatWindow),
    [renderCombatWindow, renderLootWindow, windowShown],
  );

  const toggleDockWindow = useCallback((key: keyof WindowVisibilityState) => {
    setWindowShown((current) => {
      return { ...current, [key]: !current[key] };
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const lowerKey = event.key.toLowerCase();
      if (
        lowerKey === 'e' &&
        renderLootWindow &&
        windowShown.loot &&
        lootWindowVisible &&
        lootSnapshot.length > 0
      ) {
        event.preventDefault();
        handleTakeAllLoot();
        return;
      }

      if (lowerKey === 'q' && interactLabel) {
        event.preventDefault();
        handleInteract();
        return;
      }

      const key = WINDOW_HOTKEYS[lowerKey];
      if (!key) return;

      event.preventDefault();
      toggleDockWindow(key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleInteract,
    handleTakeAllLoot,
    interactLabel,
    lootSnapshot.length,
    lootWindowVisible,
    renderLootWindow,
    toggleDockWindow,
    windowShown.loot,
  ]);

  return (
    <div className={styles.appRoot}>
      <div className={isReady ? undefined : styles.hiddenUntilReady}>
        <div ref={hostRef} className={styles.mapViewport} />
        <div className={styles.worldClock} aria-label="World time">
          <div className={styles.worldClockMetric}>
            <span className={styles.worldClockLabel}>World Time</span>
            <strong className={styles.worldClockValue}>{worldTimeLabel}</strong>
          </div>
          <div className={styles.worldClockMetric}>
            <span className={styles.worldClockLabel}>FPS</span>
            <strong className={styles.worldClockValue}>{fps}</strong>
          </div>
        </div>
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
