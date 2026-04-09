import {
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
  type Item,
  type LogKind,
} from './game/state';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  HEX_SIZE,
  WORLD_RADIUS,
  type WindowPositions,
} from './app/constants';
import { normalizeLoadedGame } from './app/normalize';
import { loadEncryptedState, saveEncryptedState } from './persistence/storage';
import { itemTooltipLines, type TooltipLine } from './ui/tooltips';
import { renderScene } from './ui/world/renderScene';
import { HeroWindow } from './ui/components/HeroWindow';
import { LegendWindow } from './ui/components/LegendWindow';
import { EquipmentWindow } from './ui/components/EquipmentWindow';
import { InventoryWindow } from './ui/components/InventoryWindow';
import { LogWindow } from './ui/components/LogWindow';
import { GameTooltip } from './ui/components/GameTooltip';
import styles from './App.module.css';

function App() {
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
  const [tooltip, setTooltip] = useState<{
    title: string;
    lines: TooltipLine[];
    x: number;
    y: number;
  } | null>(null);

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
        const ui = saved.ui as {
          windows?: WindowPositions;
          logFilters?: Record<LogKind, boolean>;
        };
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

  const moveWindow = (
    key: keyof WindowPositions,
    position: WindowPositions[keyof WindowPositions],
  ) => {
    setWindows((current) => ({ ...current, [key]: position }));
  };

  const showItemTooltip = (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      title: item.name,
      lines: itemTooltipLines(item, equipped),
      x: rect.right + 12,
      y: rect.top,
    });
  };

  return (
    <div className={styles.appRoot}>
      <div ref={hostRef} className={styles.mapViewport} />

      <HeroWindow
        position={windows.hero}
        onMove={(position) => moveWindow('hero', position)}
        stats={stats}
        hunger={game.player.hunger}
      />
      <LegendWindow
        position={windows.legend}
        onMove={(position) => moveWindow('legend', position)}
      />
      <EquipmentWindow
        position={windows.equipment}
        onMove={(position) => moveWindow('equipment', position)}
        equipment={game.player.equipment}
        onHoverItem={(event, item) => showItemTooltip(event, item)}
        onLeaveItem={() => setTooltip(null)}
        onUnequip={(slot) => setGame((current) => unequipItem(current, slot))}
      />
      <InventoryWindow
        position={windows.inventory}
        onMove={(position) => moveWindow('inventory', position)}
        gold={game.player.gold}
        inventory={game.player.inventory}
        equipment={game.player.equipment}
        onSort={() => setGame((current) => sortInventory(current))}
        onProspect={() => setGame((current) => prospectInventory(current))}
        onSellAll={() => setGame((current) => sellAllItems(current))}
        onEquip={(itemId) => setGame((current) => equipItem(current, itemId))}
        onHoverItem={showItemTooltip}
        onLeaveItem={() => setTooltip(null)}
      />
      <LogWindow
        position={windows.log}
        onMove={(position) => moveWindow('log', position)}
        filters={logFilters}
        defaultFilters={DEFAULT_LOG_FILTERS}
        showFilterMenu={showFilterMenu}
        onToggleMenu={() => setShowFilterMenu((current) => !current)}
        onToggleFilter={(kind) =>
          setLogFilters((current) => ({ ...current, [kind]: !current[kind] }))
        }
        logs={filteredLogs}
      />
      <GameTooltip tooltip={tooltip} />
    </div>
  );
}

export default App;
