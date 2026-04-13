import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import * as stateModule from '../../game/state';
import type { GameState } from '../../game/state';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import * as tooltipModule from '../../ui/tooltips';
import { getWorldHexSize } from '../../ui/world/renderSceneMath';
import { getWorldTimeMinutesFromTimestamp } from '../../ui/world/timeOfDay';
import { WORLD_REVEAL_RADIUS } from '../constants';
import type { TooltipState } from './types';
import { getTooltipState } from './tooltipStore';

interface UsePixiWorldArgs {
  game: GameState;
  worldTimeMsRef: MutableRefObject<number>;
  frameCountRef: MutableRefObject<number>;
  gameRef: MutableRefObject<GameState>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
}

interface WorldHoverSnapshot {
  game: GameState | null;
  target: stateModule.HexCoord | null;
  clickable: boolean;
  hoveredMove: stateModule.HexCoord | null;
  hoveredSafePath: stateModule.HexCoord[] | null;
  tooltip: TooltipState | null;
  tooltipKey: string | null;
}

export function usePixiWorld({
  game,
  worldTimeMsRef,
  frameCountRef,
  gameRef,
  tooltipPositionRef,
  setGame,
  setTooltip,
}: UsePixiWorldArgs) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldTooltipKeyRef = useRef<string | null>(null);
  const playerCoordRef = useRef(game.player.coord);
  const visibleTilesRef = useRef(stateModule.getVisibleTiles(game));
  const selectedRef = useRef(game.player.coord);
  const hoveredMoveRef = useRef<stateModule.HexCoord | null>(null);
  const hoveredSafePathRef = useRef<stateModule.HexCoord[] | null>(null);
  const hoverSnapshotRef = useRef<WorldHoverSnapshot>({
    game: null,
    target: null,
    clickable: false,
    hoveredMove: null,
    hoveredSafePath: null,
    tooltip: null,
    tooltipKey: null,
  });
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    playerCoordRef.current = game.player.coord;
    visibleTilesRef.current = stateModule.getVisibleTiles(game);
    gameRef.current = game;
  }, [game, gameRef]);

  useEffect(() => {
    selectedRef.current = game.player.coord;
    hoveredMoveRef.current = null;
    hoveredSafePathRef.current = null;
    hoverSnapshotRef.current = {
      game: null,
      target: null,
      clickable: false,
      hoveredMove: null,
      hoveredSafePath: null,
      tooltip: null,
      tooltipKey: null,
    };
  }, [game.player.coord]);

  useEffect(() => {
    if (!hostRef.current || appRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void Promise.all([
      import('pixi.js'),
      import('../../ui/world/renderScene'),
      import('../../ui/world/worldMapFishEye'),
    ]).then(([pixiModule, renderSceneModule, fishEyeModule]) => {
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
          getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
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
        const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
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
        const withinVisibleMap = distance <= WORLD_REVEAL_RADIUS;
        const safePath =
          distance > 1 ? stateModule.getSafePathToTile(current, target) : null;
        const clickable =
          (distance === 1 &&
            tile.terrain !== 'rift' &&
            tile.terrain !== 'mountain') ||
          (withinVisibleMap && Boolean(safePath));

        if (!clickable) return;

        selectedRef.current = target;
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
        const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
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
        const nextTooltipPosition = {
          x: event.clientX + 16,
          y: event.clientY + 16,
        };
        const current = gameRef.current;
        const hoverSnapshot = hoverSnapshotRef.current;

        if (
          hoverSnapshot.game === current &&
          sameCoord(hoverSnapshot.target, target)
        ) {
          canvas.style.cursor = hoverSnapshot.clickable ? 'pointer' : 'default';

          if (!sameCoord(hoveredMoveRef.current, hoverSnapshot.hoveredMove)) {
            hoveredMoveRef.current = hoverSnapshot.hoveredMove;
          }

          if (
            !samePath(hoveredSafePathRef.current, hoverSnapshot.hoveredSafePath)
          ) {
            hoveredSafePathRef.current = hoverSnapshot.hoveredSafePath;
          }

          if (hoverSnapshot.tooltip?.followCursor) {
            tooltipPositionRef.current = nextTooltipPosition;
            const currentTooltip = getTooltipState();

            if (
              worldTooltipKeyRef.current !== hoverSnapshot.tooltipKey ||
              !currentTooltip?.followCursor
            ) {
              worldTooltipKeyRef.current = hoverSnapshot.tooltipKey;
              setTooltip({
                ...hoverSnapshot.tooltip,
                x: nextTooltipPosition.x,
                y: nextTooltipPosition.y,
              });
            }
          } else {
            tooltipPositionRef.current = null;

            if (worldTooltipKeyRef.current || getTooltipState()?.followCursor) {
              worldTooltipKeyRef.current = null;
              setTooltip(null);
            }
          }

          return;
        }

        const tile = stateModule.getTileAt(current, target);
        const enemies = stateModule.getEnemiesAt(current, target);
        const distance = stateModule.hexDistance(
          playerCoordRef.current,
          target,
        );
        const withinVisibleMap = distance <= WORLD_REVEAL_RADIUS;
        const safePath =
          distance > 1 ? stateModule.getSafePathToTile(current, target) : null;
        const clickable =
          (distance === 1 &&
            tile.terrain !== 'rift' &&
            tile.terrain !== 'mountain') ||
          (withinVisibleMap && Boolean(safePath));
        const enemyInfo = withinVisibleMap
          ? tooltipModule.enemyTooltip(enemies, tile.structure)
          : null;
        const structureInfo = withinVisibleMap
          ? tooltipModule.structureTooltip(tile)
          : null;

        canvas.style.cursor = clickable ? 'pointer' : 'default';
        const currentHovered = hoveredMoveRef.current;
        const currentHoveredPath = hoveredSafePathRef.current;
        if (!clickable) {
          if (currentHovered) {
            hoveredMoveRef.current = null;
          }
          if (currentHoveredPath) {
            hoveredSafePathRef.current = null;
          }
        } else if (
          currentHovered?.q !== target.q ||
          currentHovered?.r !== target.r
        ) {
          hoveredMoveRef.current = target;
        }

        const nextHoveredPath =
          safePath && safePath.length > 1 ? safePath : null;
        if (!samePath(currentHoveredPath, nextHoveredPath)) {
          hoveredSafePathRef.current = nextHoveredPath;
        }

        let nextTooltip: TooltipState | null = null;
        let nextTooltipKey: string | null = null;

        if (enemyInfo) {
          nextTooltipKey = `enemy:${target.q},${target.r}:${tile.structure ?? 'none'}`;
          nextTooltip = {
            title: enemyInfo.title,
            lines: enemyInfo.lines,
            x: nextTooltipPosition.x,
            y: nextTooltipPosition.y,
            borderColor: tile.structure === 'dungeon' ? '#a855f7' : '#ef4444',
            followCursor: true,
          };

          if (
            worldTooltipKeyRef.current === nextTooltipKey &&
            getTooltipState()?.followCursor
          ) {
            return;
          }
        } else if (structureInfo) {
          nextTooltipKey = `structure:${target.q},${target.r}:${tile.structure ?? 'none'}`;
          nextTooltip = {
            title: structureInfo.title,
            lines: structureInfo.lines,
            x: nextTooltipPosition.x,
            y: nextTooltipPosition.y,
            borderColor: '#38bdf8',
            followCursor: true,
          };

          if (
            worldTooltipKeyRef.current === nextTooltipKey &&
            getTooltipState()?.followCursor
          ) {
            return;
          }
        }

        hoverSnapshotRef.current = {
          game: current,
          target,
          clickable,
          hoveredMove: clickable ? target : null,
          hoveredSafePath: nextHoveredPath,
          tooltip: nextTooltip,
          tooltipKey: nextTooltipKey,
        };

        if (nextTooltip) {
          tooltipPositionRef.current = nextTooltipPosition;
          worldTooltipKeyRef.current = nextTooltipKey;
          setTooltip(nextTooltip);
        } else {
          tooltipPositionRef.current = null;
          if (worldTooltipKeyRef.current || getTooltipState()?.followCursor) {
            worldTooltipKeyRef.current = null;
            setTooltip(null);
          }
        }
      };

      const onPointerLeave = () => {
        canvas.style.cursor = 'default';
        tooltipPositionRef.current = null;
        worldTooltipKeyRef.current = null;
        hoverSnapshotRef.current = {
          game: null,
          target: null,
          clickable: false,
          hoveredMove: null,
          hoveredSafePath: null,
          tooltip: null,
          tooltipKey: null,
        };
        if (hoveredMoveRef.current) {
          hoveredMoveRef.current = null;
        }
        if (hoveredSafePathRef.current) {
          hoveredSafePathRef.current = null;
        }
        if (getTooltipState()?.followCursor) {
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
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [
    frameCountRef,
    gameRef,
    setGame,
    setTooltip,
    tooltipPositionRef,
    worldTimeMsRef,
  ]);

  return { hostRef, canvasReady };
}

function samePath(
  left: stateModule.HexCoord[] | null,
  right: stateModule.HexCoord[] | null,
) {
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

function sameCoord(
  left: stateModule.HexCoord | null,
  right: stateModule.HexCoord | null,
) {
  return left?.q === right?.q && left?.r === right?.r;
}
