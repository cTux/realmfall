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
  attackCombatEnemy,
  buyTownItem,
  canEquipItem,
  canUseItem,
  createGame,
  describeStructure,
  dropEquippedItem,
  dropInventoryItem,
  equipItem,
  getCurrentTile,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getTileAt,
  getTownStock,
  getVisibleTiles,
  hexAtPoint,
  hexDistance,
  interactWithStructure,
  moveToTile,
  prospectInventory,
  sellAllItems,
  structureActionLabel,
  takeAllTileItems,
  takeTileItem,
  sortInventory,
  unequipItem,
  useItem as applyItemUse,
  type GameState,
  type HexCoord,
  type LogKind,
} from '../../game/state';
import {
  DEFAULT_WINDOW_COLLAPSED,
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  HEX_SIZE,
  type WindowCollapsedState,
  WORLD_RADIUS,
  type WindowPositions,
} from '../constants';
import { normalizeLoadedGame } from '../normalize';
import {
  loadEncryptedState,
  saveEncryptedState,
} from '../../persistence/storage';
import {
  enemyTooltip,
  itemTooltipLines,
  structureTooltip,
} from '../../ui/tooltips';
import { rarityColor } from '../../ui/rarity';
import { renderScene } from '../../ui/world/renderScene';
import { HeroWindow } from '../../ui/components/HeroWindow';
import { SkillsWindow } from '../../ui/components/SkillsWindow';
import { LegendWindow } from '../../ui/components/LegendWindow';
import { HexInfoWindow } from '../../ui/components/HexInfoWindow';
import { EquipmentWindow } from '../../ui/components/EquipmentWindow';
import { InventoryWindow } from '../../ui/components/InventoryWindow';
import { LogWindow } from '../../ui/components/LogWindow';
import { GameTooltip } from '../../ui/components/GameTooltip';
import { CombatWindow } from '../../ui/components/CombatWindow';
import { LootWindow } from '../../ui/components/LootWindow';
import { ItemContextMenu } from '../../ui/components/ItemContextMenu';
import type {
  ItemContextMenuState,
  PersistedUiState,
  TooltipItem,
  TooltipState,
} from './types';
import styles from './styles.module.css';

export function App() {
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const playerCoordRef = useRef<HexCoord>({ q: 0, r: 0 });
  const gameRef = useRef<GameState>(initialGameRef.current);
  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const [selected, setSelected] = useState<HexCoord>(game.player.coord);
  const [hoveredMove, setHoveredMove] = useState<HexCoord | null>(null);
  const [windows, setWindows] = useState<WindowPositions>(DEFAULT_WINDOWS);
  const [windowCollapsed, setWindowCollapsed] = useState<WindowCollapsedState>(
    DEFAULT_WINDOW_COLLAPSED,
  );
  const [logFilters, setLogFilters] = useState(DEFAULT_LOG_FILTERS);
  const [hydrated, setHydrated] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);
  const [dismissedLootKey, setDismissedLootKey] = useState<string | null>(null);

  const stats = useMemo(() => getPlayerStats(game.player), [game.player]);
  const visibleTiles = useMemo(() => getVisibleTiles(game), [game]);
  const currentTile = useMemo(() => getCurrentTile(game), [game]);
  const canProspect = currentTile.structure === 'forge';
  const canSell = currentTile.structure === 'town';
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
  const showLootWindow = Boolean(
    !game.combat && lootWindowKey && lootWindowKey !== dismissedLootKey,
  );
  const [renderLootWindow, setRenderLootWindow] = useState(showLootWindow);
  const [lootWindowVisible, setLootWindowVisible] = useState(showLootWindow);
  const [lootSnapshot, setLootSnapshot] = useState(currentTile.items);
  const filteredLogs = useMemo(
    () => game.logs.filter((entry) => logFilters[entry.kind]),
    [game.logs, logFilters],
  );
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

  useEffect(() => {
    playerCoordRef.current = game.player.coord;
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!game.combat || combatEnemies.length === 0) return;

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        const enemyId = current.combat?.enemyIds[0];
        return enemyId ? attackCombatEnemy(current, enemyId) : current;
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [combatEnemies, game.combat]);

  useEffect(() => {
    if (!lootWindowKey) setDismissedLootKey(null);
  }, [lootWindowKey]);

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
        setGame(normalizeLoadedGame(saved.game as GameState));
      }
      if (saved?.ui) {
        const ui = saved.ui as {
          windows?: WindowPositions;
          windowCollapsed?: WindowCollapsedState;
        } & PersistedUiState;
        if (ui.windows) setWindows({ ...DEFAULT_WINDOWS, ...ui.windows });
        if (ui.windowCollapsed) {
          setWindowCollapsed({
            ...DEFAULT_WINDOW_COLLAPSED,
            ...ui.windowCollapsed,
          });
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
      game,
      ui: { windows, windowCollapsed, logFilters },
    });
  }, [game, hydrated, logFilters, windowCollapsed, windows]);

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

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hoveredOffset = hexAtPoint(x, y, {
        centerX: app.screen.width / 2,
        centerY: app.screen.height / 2,
        size: HEX_SIZE,
      });
      const target = {
        q: playerCoordRef.current.q + hoveredOffset.q,
        r: playerCoordRef.current.r + hoveredOffset.r,
      };
      const current = gameRef.current;
      const tile = getTileAt(current, target);
      const enemies = getEnemiesAt(current, target);
      const withinVisibleMap =
        hexDistance(playerCoordRef.current, target) <= current.radius;
      const clickable =
        hexDistance(playerCoordRef.current, target) === 1 &&
        tile.terrain !== 'water' &&
        tile.terrain !== 'mountain';
      const enemyInfo = withinVisibleMap
        ? enemyTooltip(enemies, tile.structure)
        : null;
      const structureInfo = withinVisibleMap ? structureTooltip(tile) : null;

      canvas.style.cursor = clickable ? 'pointer' : 'default';
      setHoveredMove((currentHovered) => {
        if (!clickable) return currentHovered ? null : currentHovered;
        if (currentHovered?.q === target.q && currentHovered?.r === target.r) {
          return currentHovered;
        }
        return target;
      });

      if (enemyInfo) {
        setTooltip({
          title: enemyInfo.title,
          lines: enemyInfo.lines,
          x: event.clientX + 16,
          y: event.clientY + 16,
          borderColor: tile.structure === 'dungeon' ? '#a855f7' : '#ef4444',
        });
      } else if (structureInfo) {
        setTooltip({
          title: structureInfo.title,
          lines: structureInfo.lines,
          x: event.clientX + 16,
          y: event.clientY + 16,
          borderColor: '#38bdf8',
        });
      } else {
        setTooltip(null);
      }
    };

    const onPointerLeave = () => {
      canvas.style.cursor = 'default';
      setHoveredMove(null);
      setTooltip(null);
    };

    canvas.addEventListener('pointerdown', onPointerDown as EventListener);
    canvas.addEventListener('pointermove', onPointerMove as EventListener);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown as EventListener);
      canvas.removeEventListener('pointermove', onPointerMove as EventListener);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    renderScene(app, game, visibleTiles, selected, hoveredMove);
  }, [game, hoveredMove, selected, visibleTiles]);

  useEffect(() => {
    setSelected(game.player.coord);
    setHoveredMove(null);
  }, [game.player.coord.q, game.player.coord.r]);

  const moveWindow = useCallback(
    (
      key: keyof WindowPositions,
      position: WindowPositions[keyof WindowPositions],
    ) => {
      setWindows((current) => ({ ...current, [key]: position }));
    },
    [],
  );

  const setCollapsedWindow = useCallback(
    (key: keyof WindowCollapsedState, collapsed: boolean) => {
      setWindowCollapsed((current) => ({ ...current, [key]: collapsed }));
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

  const handleHeroMove = useCallback(
    (position: WindowPositions['hero']) => moveWindow('hero', position),
    [moveWindow],
  );

  const handleLegendMove = useCallback(
    (position: WindowPositions['legend']) => moveWindow('legend', position),
    [moveWindow],
  );

  const handleSkillsMove = useCallback(
    (position: WindowPositions['skills']) => moveWindow('skills', position),
    [moveWindow],
  );

  const handleHexInfoMove = useCallback(
    (position: WindowPositions['hexInfo']) => moveWindow('hexInfo', position),
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

  const handleLootMove = useCallback(
    (position: WindowPositions['loot']) => moveWindow('loot', position),
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

  const handleInteract = useCallback(() => {
    setGame((current) => interactWithStructure(current));
  }, []);

  const handleBuyTownItem = useCallback((itemId: string) => {
    setGame((current) => buyTownItem(current, itemId));
  }, []);

  const handleEquip = useCallback((itemId: string) => {
    setGame((current) => equipItem(current, itemId));
  }, []);

  const handleUseItem = useCallback((itemId: string) => {
    setGame((current) => applyItemUse(current, itemId));
  }, []);

  const handleDropItem = useCallback((itemId: string) => {
    setGame((current) => dropInventoryItem(current, itemId));
  }, []);

  const handleDropEquippedItem = useCallback(
    (slot: Parameters<typeof unequipItem>[1]) => {
      setGame((current) => dropEquippedItem(current, slot));
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
    setGame((current) => takeTileItem(current, itemId));
  }, []);

  const handleTakeAllLoot = useCallback(() => {
    setGame((current) => takeAllTileItems(current));
  }, []);

  const handleCloseLoot = useCallback(() => {
    if (lootWindowKey) setDismissedLootKey(lootWindowKey);
  }, [lootWindowKey]);

  const handleAttackEnemy = useCallback((enemyId: string) => {
    setGame((current) => attackCombatEnemy(current, enemyId));
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
        collapsed={windowCollapsed.hero}
        onCollapsedChange={(collapsed) => setCollapsedWindow('hero', collapsed)}
        stats={stats}
        hunger={game.player.hunger}
      />
      <SkillsWindow
        position={windows.skills}
        onMove={handleSkillsMove}
        collapsed={windowCollapsed.skills}
        onCollapsedChange={(collapsed) =>
          setCollapsedWindow('skills', collapsed)
        }
        skills={stats.skills}
      />
      <LegendWindow
        position={windows.legend}
        onMove={handleLegendMove}
        collapsed={windowCollapsed.legend}
        onCollapsedChange={(collapsed) =>
          setCollapsedWindow('legend', collapsed)
        }
      />
      <HexInfoWindow
        position={windows.hexInfo}
        onMove={handleHexInfoMove}
        collapsed={windowCollapsed.hexInfo}
        onCollapsedChange={(collapsed) =>
          setCollapsedWindow('hexInfo', collapsed)
        }
        terrain={
          currentTile.terrain.charAt(0).toUpperCase() +
          currentTile.terrain.slice(1)
        }
        structure={describeStructure(currentTile.structure)}
        enemyCount={
          game.combat ? combatEnemies.length : currentTile.enemyIds.length
        }
        interactLabel={interactLabel}
        canInteract={Boolean(interactLabel)}
        canProspect={canProspect}
        canSell={canSell}
        onInteract={handleInteract}
        onProspect={handleProspect}
        onSellAll={handleSellAll}
        structureHp={currentTile.structureHp}
        structureMaxHp={currentTile.structureMaxHp}
        townStock={townStock}
        gold={gold}
        onBuyItem={handleBuyTownItem}
        onHoverItem={showItemTooltip}
        onLeaveItem={closeTooltip}
      />
      <EquipmentWindow
        position={windows.equipment}
        onMove={handleEquipmentMove}
        collapsed={windowCollapsed.equipment}
        onCollapsedChange={(collapsed) =>
          setCollapsedWindow('equipment', collapsed)
        }
        equipment={game.player.equipment}
        onHoverItem={handleEquipmentHover}
        onLeaveItem={closeTooltip}
        onUnequip={handleUnequip}
        onContextItem={handleEquippedContextItem}
      />
      <InventoryWindow
        position={windows.inventory}
        onMove={handleInventoryMove}
        collapsed={windowCollapsed.inventory}
        onCollapsedChange={(collapsed) =>
          setCollapsedWindow('inventory', collapsed)
        }
        inventory={game.player.inventory}
        equipment={game.player.equipment}
        onSort={handleSort}
        onEquip={handleEquip}
        onContextItem={handleContextItem}
        onHoverItem={showItemTooltip}
        onLeaveItem={closeTooltip}
      />
      {renderLootWindow ? (
        <LootWindow
          position={windows.loot}
          onMove={handleLootMove}
          collapsed={windowCollapsed.loot}
          onCollapsedChange={(collapsed) =>
            setCollapsedWindow('loot', collapsed)
          }
          visible={lootWindowVisible}
          loot={lootSnapshot}
          equipment={game.player.equipment}
          onClose={handleCloseLoot}
          onTakeAll={handleTakeAllLoot}
          onTakeItem={handleTakeLootItem}
          onHoverItem={showItemTooltip}
          onLeaveItem={closeTooltip}
        />
      ) : null}
      {itemMenu ? (
        <ItemContextMenu
          item={itemMenu.item}
          x={itemMenu.x}
          y={itemMenu.y}
          equipLabel={itemMenu.slot ? 'Unequip' : 'Equip'}
          canEquip={itemMenu.slot ? true : canEquipItem(itemMenu.item)}
          canUse={canUseItem(itemMenu.item)}
          onEquip={() => {
            if (itemMenu.slot) {
              handleUnequip(itemMenu.slot);
            } else {
              handleEquip(itemMenu.item.id);
            }
            closeItemMenu();
          }}
          onUse={() => {
            handleUseItem(itemMenu.item.id);
            closeItemMenu();
          }}
          onDrop={() => {
            if (itemMenu.slot) {
              handleDropEquippedItem(itemMenu.slot);
            } else {
              handleDropItem(itemMenu.item.id);
            }
            closeItemMenu();
          }}
          onClose={closeItemMenu}
        />
      ) : null}
      <LogWindow
        position={windows.log}
        onMove={handleLogMove}
        collapsed={windowCollapsed.log}
        onCollapsedChange={(collapsed) => setCollapsedWindow('log', collapsed)}
        filters={logFilters}
        defaultFilters={DEFAULT_LOG_FILTERS}
        showFilterMenu={showFilterMenu}
        onToggleMenu={toggleFilterMenu}
        onToggleFilter={toggleLogFilter}
        logs={filteredLogs}
      />
      {renderCombatWindow && combatSnapshot ? (
        <CombatWindow
          position={windows.combat}
          onMove={(position) => moveWindow('combat', position)}
          collapsed={windowCollapsed.combat}
          onCollapsedChange={(collapsed) =>
            setCollapsedWindow('combat', collapsed)
          }
          visible={combatWindowVisible}
          combat={combatSnapshot.combat}
          enemies={combatSnapshot.enemies}
          player={{
            hp: stats.hp,
            maxHp: stats.maxHp,
            attack: stats.attack,
            defense: stats.defense,
          }}
          onAttack={handleAttackEnemy}
        />
      ) : null}
      <GameTooltip tooltip={tooltip} />
    </div>
  );
}
