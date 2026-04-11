import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { Application } from 'pixi.js';
import {
  getEnemiesAt,
  getTileAt,
  hexAtPoint,
  hexDistance,
  moveToTile,
  type GameState,
  type HexCoord,
} from '../../game/state';
import { enemyTooltip, structureTooltip } from '../../ui/tooltips';
import { renderScene } from '../../ui/world/renderScene';
import { getWorldTimeMinutesFromTimestamp } from '../../ui/world/timeOfDay';
import { HEX_SIZE, WORLD_REVEAL_RADIUS } from '../constants';
import type { TooltipState } from './types';
import {
  mapWorldMapFishEyeDisplayPointToSourcePoint,
  WORLD_MAP_FISHEYE_ENABLED,
} from '../../ui/world/worldMapFishEye';

interface UsePixiWorldArgs {
  game: GameState;
  visibleTiles: ReturnType<typeof import('../../game/state').getVisibleTiles>;
  selected: HexCoord;
  hoveredMove: HexCoord | null;
  worldTimeMsRef: MutableRefObject<number>;
  frameCountRef: MutableRefObject<number>;
  playerCoordRef: MutableRefObject<HexCoord>;
  gameRef: MutableRefObject<GameState>;
  visibleTilesRef: MutableRefObject<
    ReturnType<typeof import('../../game/state').getVisibleTiles>
  >;
  selectedRef: MutableRefObject<HexCoord>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setSelected: Dispatch<SetStateAction<HexCoord>>;
  setHoveredMove: Dispatch<SetStateAction<HexCoord | null>>;
  setTooltip: Dispatch<SetStateAction<TooltipState | null>>;
}

export function usePixiWorld({
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
}: UsePixiWorldArgs) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

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

    const renderFrame = () => {
      frameCountRef.current += 1;
      renderScene(
        app,
        gameRef.current,
        visibleTilesRef.current,
        selectedRef.current,
        hoveredMoveRef.current,
        getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
        performance.now(),
      );
    };

    renderFrame();
    app.ticker.add(renderFrame);
    setCanvasReady(true);

    const observer = new ResizeObserver(() => resize());
    observer.observe(hostRef.current);
    window.addEventListener('resize', resize);

    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const displayPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const sourcePoint = WORLD_MAP_FISHEYE_ENABLED
        ? mapWorldMapFishEyeDisplayPointToSourcePoint(
            displayPoint,
            app.screen,
            {
              x: app.screen.width / 2,
              y: app.screen.height / 2,
            },
          )
        : displayPoint;
      const clickedOffset = hexAtPoint(sourcePoint.x, sourcePoint.y, {
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
      setGame((currentState) =>
        moveToTile(
          { ...currentState, worldTimeMs: worldTimeMsRef.current },
          target,
        ),
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const displayPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const sourcePoint = WORLD_MAP_FISHEYE_ENABLED
        ? mapWorldMapFishEyeDisplayPointToSourcePoint(
            displayPoint,
            app.screen,
            {
              x: app.screen.width / 2,
              y: app.screen.height / 2,
            },
          )
        : displayPoint;
      const hoveredOffset = hexAtPoint(sourcePoint.x, sourcePoint.y, {
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
        hexDistance(playerCoordRef.current, target) <= WORLD_REVEAL_RADIUS;
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
      app.ticker.remove(renderFrame);
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    };
  }, [
    frameCountRef,
    gameRef,
    hoveredMoveRef,
    playerCoordRef,
    selectedRef,
    setGame,
    setHoveredMove,
    setSelected,
    setTooltip,
    visibleTilesRef,
    worldTimeMsRef,
  ]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    renderScene(
      app,
      game,
      visibleTiles,
      selected,
      hoveredMove,
      getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
    );
  }, [game, hoveredMove, selected, visibleTiles, worldTimeMsRef]);

  return { hostRef, canvasReady };
}
