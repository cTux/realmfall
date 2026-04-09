import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Application } from 'pixi.js';
import {
  createGame,
  equipItem,
  getPlayerStats,
  getTileAt,
  getVisibleTiles,
  hexAtPoint,
  hexDistance,
  moveToTile,
  prospectInventory,
  sellAllItems,
  sortInventory,
  unequipItem,
  type GameState,
  type HexCoord,
  type LogKind,
} from '../../game/state';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  HEX_SIZE,
  WORLD_RADIUS,
  type WindowPositions,
} from '../constants';
import { normalizeLoadedGame } from '../normalize';
import {
  loadEncryptedState,
  saveEncryptedState,
} from '../../persistence/storage';
import { itemTooltipLines } from '../../ui/tooltips';
import { renderScene } from '../../ui/world/renderScene';
import { HeroWindow } from '../../ui/components/HeroWindow';
import { LegendWindow } from '../../ui/components/LegendWindow';
import { EquipmentWindow } from '../../ui/components/EquipmentWindow';
import { InventoryWindow } from '../../ui/components/InventoryWindow';
import { LogWindow } from '../../ui/components/LogWindow';
import { GameTooltip } from '../../ui/components/GameTooltip';
import type { PersistedUiState, TooltipItem, TooltipState } from './types';
import styles from './styles.module.css';

export function App() {
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const playerCoordRef = useRef<HexCoord>({ q: 0, r: 0 });
  const gameRef = useRef<GameState>(initialGameRef.current);
  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const [selected, setSelected] = useState<HexCoord>(game.player.coord);
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [logFilters, setLogFilters] = useState(DEFAULT_LOG_FILTERS);
  const [hydrated, setHydrated] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const stats = useMemo(() => getPlayerStats(game.player), [game.player]);
  const visibleTiles = useMemo(() => getVisibleTiles(game), [game]);
  const filteredLogs = useMemo(
    () => game.logs.filter((entry) => logFilters[entry.kind]),
    [game.logs, logFilters],
  );

  useEffect(() => {
    playerCoordRef.current = game.player.coord;
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    let alive = true;

    void loadEncryptedState().then((saved) => {
      if (!alive) return;
      if (saved?.game) {
        setGame(normalizeLoadedGame(saved.game as GameState));
      }
      if (saved?.ui) {
        const ui = saved.ui as { windows?: WindowPositions } & PersistedUiState;
        if (ui.windows) setWindows({ ...DEFAULT_WINDOWS, ...ui.windows });
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
    void saveEncryptedState({ game, ui: { windows, logFilters } });
  }, [game, hydrated, logFilters, windows]);

  useEffect(() => {
    if (!hostRef.current || appRef.current) return;

    const app = new Application({
      width: Math.max(window.innerWidth, 640),
      height: Math.max(window.innerHeight, 480),
      backgroundColor: 0x0b1020,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    appRef.current = app;
    const canvas = app.view as HTMLCanvasElement;
    hostRef.current.replaceChildren(canvas);

    const resize = () => {
      const width = hostRef.current?.clientWidth ?? window.innerWidth;
      const height = hostRef.current?.clientHeight ?? window.innerHeight;
      app.renderer.resize(width, height);
    };

    resize();

    const observer = new ResizeObserver(() => resize());
    observer.observe(hostRef.current);
    window.addEventListener('resize', resize);

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const clickedOffset = hexAtPoint(x, y, {
        centerX: app.screen.width / 2,
        centerY: app.screen.height / 2,
        size: HEX_SIZE,
      });
      const target = {
        q: playerCoordRef.current.q + clickedOffset.q,
        r: playerCoordRef.current.r + clickedOffset.r,
      };
      const current = gameRef.current;
      const tile = getTileAt(current, target);
      const clickable =
        hexDistance(playerCoordRef.current, target) === 1 &&
        tile.terrain !== 'water' &&
        tile.terrain !== 'mountain';

      if (!clickable) return;

      setSelected(target);
      setGame((currentState) => moveToTile(currentState, target));
    };

    canvas.addEventListener('pointerdown', onPointerDown as EventListener);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown as EventListener);
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    renderScene(app, game, visibleTiles, selected);
  }, [game, selected, visibleTiles]);

  useEffect(() => {
    setSelected(game.player.coord);
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

  const closeTooltip = useCallback(() => {
    setTooltip(null);
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
      });
    },
    [],
  );

  const handleHeroMove = useCallback(
    (position: WindowPositions['hero']) => moveWindow('hero', position),
    [moveWindow],
  );

  const handleLegendMove = useCallback(
    (position: WindowPositions['legend']) => moveWindow('legend', position),
    [moveWindow],
  );

  const handleEquipmentMove = useCallback(
    (position: WindowPositions['equipment']) =>
      moveWindow('equipment', position),
    [moveWindow],
  );

  const handleInventoryMove = useCallback(
    (position: WindowPositions['inventory']) =>
      moveWindow('inventory', position),
    [moveWindow],
  );

  const handleLogMove = useCallback(
    (position: WindowPositions['log']) => moveWindow('log', position),
    [moveWindow],
  );

  const handleUnequip = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      setGame((current) => unequipItem(current, slot));
    },
    [],
  );

  const handleSort = useCallback(() => {
    setGame((current) => sortInventory(current));
  }, []);

  const handleProspect = useCallback(() => {
    setGame((current) => prospectInventory(current));
  }, []);

  const handleSellAll = useCallback(() => {
    setGame((current) => sellAllItems(current));
  }, []);

  const handleEquip = useCallback((itemId: string) => {
    setGame((current) => equipItem(current, itemId));
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

  return (
    <div className={styles.appRoot}>
      <div ref={hostRef} className={styles.mapViewport} />

      <HeroWindow
        position={windows.hero}
        onMove={handleHeroMove}
        stats={stats}
        hunger={game.player.hunger}
      />
      <LegendWindow position={windows.legend} onMove={handleLegendMove} />
      <EquipmentWindow
        position={windows.equipment}
        onMove={handleEquipmentMove}
        equipment={game.player.equipment}
        onHoverItem={handleEquipmentHover}
        onLeaveItem={closeTooltip}
        onUnequip={handleUnequip}
      />
      <InventoryWindow
        position={windows.inventory}
        onMove={handleInventoryMove}
        gold={game.player.gold}
        inventory={game.player.inventory}
        equipment={game.player.equipment}
        onSort={handleSort}
        onProspect={handleProspect}
        onSellAll={handleSellAll}
        onEquip={handleEquip}
        onHoverItem={showItemTooltip}
        onLeaveItem={closeTooltip}
      />
      <LogWindow
        position={windows.log}
        onMove={handleLogMove}
        filters={logFilters}
        defaultFilters={DEFAULT_LOG_FILTERS}
        showFilterMenu={showFilterMenu}
        onToggleMenu={toggleFilterMenu}
        onToggleFilter={toggleLogFilter}
        logs={filteredLogs}
      />
      <GameTooltip tooltip={tooltip} />
    </div>
  );
}
