import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import type { GameState, HexCoord } from '../../game/state';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { WORLD_REVEAL_RADIUS } from '../constants';
import type { TooltipState } from './types';

interface UsePixiWorldArgs {
  worldTimeMsRef: MutableRefObject<number>;
  frameCountRef: MutableRefObject<number>;
  playerCoordRef: MutableRefObject<HexCoord>;
  gameRef: MutableRefObject<GameState>;
  visibleTilesRef: MutableRefObject<
    ReturnType<typeof import('../../game/state').getVisibleTiles>
  >;
  selectedRef: MutableRefObject<HexCoord>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  tooltipRef: MutableRefObject<TooltipState | null>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setSelected: Dispatch<SetStateAction<HexCoord>>;
  setHoveredMove: Dispatch<SetStateAction<HexCoord | null>>;
  setHoveredSafePath: Dispatch<SetStateAction<HexCoord[] | null>>;
  setTooltip: Dispatch<SetStateAction<TooltipState | null>>;
}

export function usePixiWorld({
  worldTimeMsRef,
  frameCountRef,
  playerCoordRef,
  gameRef,
  visibleTilesRef,
  selectedRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  tooltipPositionRef,
  tooltipRef,
  setGame,
  setSelected,
  setHoveredMove,
  setHoveredSafePath,
  setTooltip,
}: UsePixiWorldArgs) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldTooltipKeyRef = useRef<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    if (!hostRef.current || appRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void Promise.all([
      import('pixi.js'),
      import('../../game/state'),
      import('../../ui/tooltips'),
      import('../../ui/world/renderScene'),
      import('../../ui/world/renderSceneMath'),
      import('../../ui/world/timeOfDay'),
      import('../../ui/world/worldMapFishEye'),
    ]).then(
      ([
        pixiModule,
        stateModule,
        tooltipModule,
        renderSceneModule,
        renderSceneMathModule,
        timeOfDayModule,
        fishEyeModule,
      ]) => {
        if (disposed || !hostRef.current || appRef.current) {
          return;
        }

        const app = new pixiModule.Application({
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

        const getSourcePoint = (displayPoint: { x: number; y: number }) =>
          fishEyeModule.WORLD_MAP_FISHEYE_ENABLED
            ? fishEyeModule.mapWorldMapFishEyeDisplayPointToSourcePoint(
                displayPoint,
                app.screen,
                {
                  x: app.screen.width / 2,
                  y: app.screen.height / 2,
                },
              )
            : displayPoint;

        resize();

        const renderFrame = () => {
          frameCountRef.current += 1;
          renderSceneModule.renderScene(
            app,
            gameRef.current,
            visibleTilesRef.current,
            selectedRef.current,
            hoveredMoveRef.current,
            timeOfDayModule.getWorldTimeMinutesFromTimestamp(
              worldTimeMsRef.current,
            ),
            performance.now(),
            hoveredSafePathRef.current,
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
          const sourcePoint = getSourcePoint({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
          const hexSize = renderSceneMathModule.getWorldHexSize(
            app.screen,
            gameRef.current.radius,
          );
          const clickedOffset = stateModule.hexAtPoint(
            sourcePoint.x,
            sourcePoint.y,
            {
              centerX: app.screen.width / 2,
              centerY: app.screen.height / 2,
              size: hexSize,
            },
          );
          const target = {
            q: playerCoordRef.current.q + clickedOffset.q,
            r: playerCoordRef.current.r + clickedOffset.r,
          };
          const current = gameRef.current;
          const tile = stateModule.getTileAt(current, target);
          const distance = stateModule.hexDistance(
            playerCoordRef.current,
            target,
          );
          const safePath =
            distance > 1
              ? stateModule.getSafePathToTile(current, target)
              : null;
          const clickable =
            (distance === 1 &&
              tile.terrain !== 'rift' &&
              tile.terrain !== 'mountain') ||
            Boolean(safePath);

          if (!clickable) return;

          setSelected(target);
          setGame((currentState) =>
            distance === 1
              ? stateModule.moveToTile(
                  { ...currentState, worldTimeMs: worldTimeMsRef.current },
                  target,
                )
              : stateModule.moveAlongSafePath(
                  { ...currentState, worldTimeMs: worldTimeMsRef.current },
                  target,
                ),
          );
        };

        const onPointerMove = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          const sourcePoint = getSourcePoint({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
          const hexSize = renderSceneMathModule.getWorldHexSize(
            app.screen,
            gameRef.current.radius,
          );
          const hoveredOffset = stateModule.hexAtPoint(
            sourcePoint.x,
            sourcePoint.y,
            {
              centerX: app.screen.width / 2,
              centerY: app.screen.height / 2,
              size: hexSize,
            },
          );
          const target = {
            q: playerCoordRef.current.q + hoveredOffset.q,
            r: playerCoordRef.current.r + hoveredOffset.r,
          };
          const current = gameRef.current;
          const tile = stateModule.getTileAt(current, target);
          const enemies = stateModule.getEnemiesAt(current, target);
          const withinVisibleMap =
            stateModule.hexDistance(playerCoordRef.current, target) <=
            WORLD_REVEAL_RADIUS;
          const distance = stateModule.hexDistance(
            playerCoordRef.current,
            target,
          );
          const safePath =
            distance > 1
              ? stateModule.getSafePathToTile(current, target)
              : null;
          const clickable =
            (distance === 1 &&
              tile.terrain !== 'rift' &&
              tile.terrain !== 'mountain') ||
            Boolean(safePath);
          const enemyInfo = withinVisibleMap
            ? tooltipModule.enemyTooltip(enemies, tile.structure)
            : null;
          const structureInfo = withinVisibleMap
            ? tooltipModule.structureTooltip(tile)
            : null;
          const nextTooltipPosition = {
            x: event.clientX + 16,
            y: event.clientY + 16,
          };

          canvas.style.cursor = clickable ? 'pointer' : 'default';
          const currentHovered = hoveredMoveRef.current;
          const currentHoveredPath = hoveredSafePathRef.current;
          if (!clickable) {
            if (currentHovered) {
              hoveredMoveRef.current = null;
              setHoveredMove(null);
            }
            if (currentHoveredPath) {
              hoveredSafePathRef.current = null;
              setHoveredSafePath(null);
            }
          } else if (
            currentHovered?.q !== target.q ||
            currentHovered?.r !== target.r
          ) {
            hoveredMoveRef.current = target;
            setHoveredMove(target);
          }

          const nextHoveredPath =
            safePath && safePath.length > 1 ? safePath : null;
          if (!samePath(currentHoveredPath, nextHoveredPath)) {
            hoveredSafePathRef.current = nextHoveredPath;
            setHoveredSafePath(nextHoveredPath);
          }

          tooltipPositionRef.current = nextTooltipPosition;

          if (enemyInfo) {
            const nextTooltipKey = `enemy:${target.q},${target.r}:${tile.structure ?? 'none'}`;
            if (
              worldTooltipKeyRef.current === nextTooltipKey &&
              tooltipRef.current?.followCursor
            ) {
              return;
            }
            worldTooltipKeyRef.current = nextTooltipKey;
            setTooltip({
              title: enemyInfo.title,
              lines: enemyInfo.lines,
              x: nextTooltipPosition.x,
              y: nextTooltipPosition.y,
              borderColor: tile.structure === 'dungeon' ? '#a855f7' : '#ef4444',
              followCursor: true,
            });
          } else if (structureInfo) {
            const nextTooltipKey = `structure:${target.q},${target.r}:${tile.structure ?? 'none'}`;
            if (
              worldTooltipKeyRef.current === nextTooltipKey &&
              tooltipRef.current?.followCursor
            ) {
              return;
            }
            worldTooltipKeyRef.current = nextTooltipKey;
            setTooltip({
              title: structureInfo.title,
              lines: structureInfo.lines,
              x: nextTooltipPosition.x,
              y: nextTooltipPosition.y,
              borderColor: '#38bdf8',
              followCursor: true,
            });
          } else {
            tooltipPositionRef.current = null;
            if (
              worldTooltipKeyRef.current ||
              tooltipRef.current?.followCursor
            ) {
              worldTooltipKeyRef.current = null;
              setTooltip(null);
            }
          }
        };

        const onPointerLeave = () => {
          canvas.style.cursor = 'default';
          tooltipPositionRef.current = null;
          worldTooltipKeyRef.current = null;
          if (hoveredMoveRef.current) {
            hoveredMoveRef.current = null;
            setHoveredMove(null);
          }
          if (hoveredSafePathRef.current) {
            hoveredSafePathRef.current = null;
            setHoveredSafePath(null);
          }
          if (tooltipRef.current?.followCursor) {
            setTooltip(null);
          }
        };

        canvas.addEventListener('pointerdown', onPointerDown as EventListener);
        canvas.addEventListener('pointermove', onPointerMove as EventListener);
        canvas.addEventListener('pointerleave', onPointerLeave);

        cleanup = () => {
          observer.disconnect();
          window.removeEventListener('resize', resize);
          canvas.removeEventListener(
            'pointerdown',
            onPointerDown as EventListener,
          );
          canvas.removeEventListener(
            'pointermove',
            onPointerMove as EventListener,
          );
          canvas.removeEventListener('pointerleave', onPointerLeave);
          app.ticker.remove(renderFrame);
          app.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true,
          });
          appRef.current = null;
          setCanvasReady(false);
        };
      },
    );

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [
    frameCountRef,
    gameRef,
    hoveredMoveRef,
    hoveredSafePathRef,
    playerCoordRef,
    selectedRef,
    setGame,
    setHoveredMove,
    setHoveredSafePath,
    setSelected,
    setTooltip,
    tooltipPositionRef,
    tooltipRef,
    visibleTilesRef,
    worldTimeMsRef,
  ]);

  return { hostRef, canvasReady };
}

function samePath(left: HexCoord[] | null, right: HexCoord[] | null) {
  if (left == null || right == null) {
    return left === right;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (coord, index) =>
      coord.q === right[index]?.q && coord.r === right[index]?.r,
  );
}
