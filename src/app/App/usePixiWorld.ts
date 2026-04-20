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
import { syncFollowCursorTooltipPosition } from '../../ui/components/GameTooltip/followCursorSync';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { getWorldHexSize } from '../../ui/world/renderSceneMath';
import {
  enemyWorldTooltip,
  structureWorldTooltip,
} from '../../ui/world/worldTooltips';
import {
  applyWorldMapCameraToContainer,
  DEFAULT_WORLD_MAP_CAMERA,
  mapWorldMapScreenPointToScenePoint,
  zoomWorldMapCameraAtPoint,
} from '../../ui/world/worldMapCamera';
import { getWorldTimeMinutesFromTimestamp } from '../../ui/world/timeOfDay';
import {
  ensureWorldIconTexturesLoaded,
} from '../../ui/world/worldIcons';
import { getSceneCache } from '../../ui/world/renderSceneCache';
import { WORLD_REVEAL_RADIUS } from '../constants';
import {
  getGraphicsRenderResolution,
  type GraphicsSettings,
} from '../graphicsSettings';
import {
  loadWorldMapSettings,
  saveWorldMapSettings,
  worldMapCameraToSettings,
  worldMapSettingsToCamera,
} from '../worldMapSettings';
import type { TooltipState } from './types';
import { reuseVisibleTilesIfUnchanged } from './selectors/reuseVisibleTilesIfUnchanged';
import {
  applyHoverSnapshot,
  getHoverAnalysisCacheKey,
  sameCoord,
  setCachedHoverSnapshot,
  type WorldHoverSnapshot,
} from './usePixiWorldHover';

interface UsePixiWorldArgs {
  enabled: boolean;
  game: GameState;
  graphicsSettings: GraphicsSettings;
  worldTimeMsRef: MutableRefObject<number>;
  gameRef: MutableRefObject<GameState>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
}

export function usePixiWorld({
  enabled,
  game,
  graphicsSettings,
  worldTimeMsRef,
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
  const hoverPointerRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
    dragging: boolean;
  } | null>(null);
  const worldMapCameraRef = useRef(DEFAULT_WORLD_MAP_CAMERA);
  const hoverFrameRef = useRef<number | null>(null);
  const cameraSaveTimerRef = useRef<number | null>(null);
  const selectedRef = useRef(game.player.coord);
  const hoveredMoveRef = useRef<stateModule.HexCoord | null>(null);
  const hoveredSafePathRef = useRef<stateModule.HexCoord[] | null>(null);
  const hoverAnalysisCacheRef = useRef(new Map<string, WorldHoverSnapshot>());
  const hoverSnapshotRef = useRef<WorldHoverSnapshot>({
    target: null,
    clickable: false,
    hoveredMove: null,
    hoveredSafePath: null,
    tooltip: null,
    tooltipKey: null,
  });
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    gameRef.current = game;
  }, [game, gameRef]);

  useEffect(() => {
    const visibleTilesState = {
      player: { coord: game.player.coord },
      radius: game.radius,
      seed: game.seed,
      tiles: game.tiles,
    };
    playerCoordRef.current = game.player.coord;
    visibleTilesRef.current = reuseVisibleTilesIfUnchanged(
      visibleTilesRef.current,
      visibleTilesState,
    );
  }, [game.player.coord, game.radius, game.seed, game.tiles]);

  useEffect(() => {
    selectedRef.current = game.player.coord;
    hoveredMoveRef.current = null;
    hoveredSafePathRef.current = null;
    hoverAnalysisCacheRef.current.clear();
    hoverSnapshotRef.current = {
      target: null,
      clickable: false,
      hoveredMove: null,
      hoveredSafePath: null,
      tooltip: null,
      tooltipKey: null,
    };
  }, [game.player.coord]);

  useEffect(() => {
    hoverAnalysisCacheRef.current.clear();
  }, [game.bloodMoonActive, game.combat, game.turn]);

  useEffect(
    () => () => {
      if (cameraSaveTimerRef.current !== null) {
        window.clearTimeout(cameraSaveTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !hostRef.current || appRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void Promise.all([
      import('../../ui/world/pixiRuntime'),
      import('../../ui/world/renderScene'),
      import('../../ui/world/worldMapFishEye'),
    ]).then(async ([pixiModule, renderSceneModule, fishEyeModule]) => {
      if (disposed || !hostRef.current || appRef.current) {
        return;
      }

      const app = new pixiModule.Application();
      await ensureWorldIconTexturesLoaded();
      await app.init({
        width: Math.max(window.innerWidth, 640),
        height: Math.max(window.innerHeight, 480),
        backgroundColor: 0x0b1020,
        backgroundAlpha: graphicsSettings.useContextAlpha ? 0 : 1,
        antialias: graphicsSettings.antialias,
        autoDensity: graphicsSettings.autoDensity,
        clearBeforeRender: graphicsSettings.clearBeforeRender,
        manageImports: false,
        preserveDrawingBuffer: graphicsSettings.preserveDrawingBuffer,
        premultipliedAlpha: graphicsSettings.premultipliedAlpha,
        preference: 'webgl',
        resolution: getGraphicsRenderResolution(
          graphicsSettings,
          window.devicePixelRatio,
        ),
      });

      if (disposed || !hostRef.current || appRef.current) {
        app.destroy(true, {
          children: true,
          texture: true,
          textureSource: true,
        });
        return;
      }

      appRef.current = app;
      const canvas = app.canvas as HTMLCanvasElement;
      worldMapCameraRef.current = worldMapSettingsToCamera(loadWorldMapSettings());
      hostRef.current.replaceChildren(canvas);

      const resize = () => {
        const width = hostRef.current?.clientWidth ?? window.innerWidth;
        const height = hostRef.current?.clientHeight ?? window.innerHeight;
        const resolution = getGraphicsRenderResolution(
          graphicsSettings,
          window.devicePixelRatio,
        );
        if (app.renderer.resolution !== resolution) {
          app.renderer.resolution = resolution;
        }
        app.renderer.resize(width, height);
        applyWorldMapCameraToContainer(
          getSceneCache(app).worldMap,
          app.screen,
          worldMapCameraRef.current,
        );
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

      const scheduleCameraSave = () => {
        if (cameraSaveTimerRef.current !== null) {
          window.clearTimeout(cameraSaveTimerRef.current);
        }

        cameraSaveTimerRef.current = window.setTimeout(() => {
          cameraSaveTimerRef.current = null;
          saveWorldMapSettings(
            worldMapCameraToSettings(worldMapCameraRef.current),
          );
        }, 300);
      };

      const clearHoverState = () => {
        hoverPointerRef.current = null;
        if (hoverFrameRef.current !== null) {
          window.cancelAnimationFrame(hoverFrameRef.current);
          hoverFrameRef.current = null;
        }
        canvas.style.cursor = 'default';
        tooltipPositionRef.current = null;
        syncFollowCursorTooltipPosition(null);
        worldTooltipKeyRef.current = null;
        hoverSnapshotRef.current = {
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
        setTooltip(null);
      };

      const getScenePoint = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const sourcePoint = getSourcePoint({
          x: clientX - rect.left,
          y: clientY - rect.top,
        });
        return mapWorldMapScreenPointToScenePoint(
          sourcePoint,
          app.screen,
          worldMapCameraRef.current,
        );
      };

      const handlePointerClick = (clientX: number, clientY: number) => {
        const scenePoint = getScenePoint(clientX, clientY);
        const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
        const clickedOffset = stateModule.hexAtPoint(
          scenePoint.x,
          scenePoint.y,
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
          distance > 1 && withinVisibleMap
            ? stateModule.getSafePathToTile(current, target)
            : null;
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

      const onPointerDown = (event: PointerEvent) => {
        dragStateRef.current = {
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startPanX: worldMapCameraRef.current.panX,
          startPanY: worldMapCameraRef.current.panY,
          dragging: false,
        };
        canvas.setPointerCapture?.(event.pointerId);
      };

      const onWheel = (event: WheelEvent) => {
        const absoluteDeltaX = Math.abs(event.deltaX);
        const absoluteDeltaY = Math.abs(event.deltaY);
        if (absoluteDeltaY === 0 || absoluteDeltaX > absoluteDeltaY) {
          return;
        }

        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const nextCamera = zoomWorldMapCameraAtPoint(
          worldMapCameraRef.current,
          worldMapCameraRef.current.zoom *
            (event.deltaY < 0 ? 1.1 : 1 / 1.1),
          {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          },
          app.screen,
        );
        if (nextCamera === worldMapCameraRef.current) {
          return;
        }

        worldMapCameraRef.current = nextCamera;
        applyWorldMapCameraToContainer(
          getSceneCache(app).worldMap,
          app.screen,
          nextCamera,
        );
        scheduleCameraSave();
      };

      const onPointerUp = (event: PointerEvent) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
          return;
        }

        canvas.releasePointerCapture?.(event.pointerId);
        dragStateRef.current = null;
        if (dragState.dragging) {
          canvas.style.cursor = 'grab';
          return;
        }

        handlePointerClick(event.clientX, event.clientY);
      };

      const onPointerCancel = (event: PointerEvent) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
          return;
        }
        canvas.releasePointerCapture?.(event.pointerId);
        dragStateRef.current = null;
        canvas.style.cursor = 'default';
      };

      const processPointerMove = (clientX: number, clientY: number) => {
        const scenePoint = getScenePoint(clientX, clientY);
        const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
        const hoveredOffset = stateModule.hexAtPoint(
          scenePoint.x,
          scenePoint.y,
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
          x: clientX + 16,
          y: clientY + 16,
        };
        const hoverSnapshot = hoverSnapshotRef.current;

        if (sameCoord(hoverSnapshot.target, target)) {
          canvas.style.cursor = hoverSnapshot.clickable ? 'pointer' : 'default';
          applyHoverSnapshot({
            hoverSnapshot,
            hoveredMoveRef,
            hoveredSafePathRef,
            nextTooltipPosition,
            setTooltip,
            tooltipPositionRef,
            worldTooltipKeyRef,
          });
          return;
        }

        const current = gameRef.current;
        const hoverCacheKey = getHoverAnalysisCacheKey(current, target);
        const cachedHoverSnapshot =
          hoverAnalysisCacheRef.current.get(hoverCacheKey);
        if (cachedHoverSnapshot) {
          canvas.style.cursor = cachedHoverSnapshot.clickable
            ? 'pointer'
            : 'default';
          hoverSnapshotRef.current = cachedHoverSnapshot;
          applyHoverSnapshot({
            hoverSnapshot: cachedHoverSnapshot,
            hoveredMoveRef,
            hoveredSafePathRef,
            nextTooltipPosition,
            setTooltip,
            tooltipPositionRef,
            worldTooltipKeyRef,
          });
          return;
        }

        const tile = stateModule.getTileAt(current, target);
        const distance = stateModule.hexDistance(
          playerCoordRef.current,
          target,
        );
        const withinVisibleMap = distance <= WORLD_REVEAL_RADIUS;
        const adjacentActionable =
          distance === 1 &&
          tile.terrain !== 'rift' &&
          tile.terrain !== 'mountain';
        const safePath =
          !adjacentActionable && distance > 1 && withinVisibleMap
            ? stateModule.getSafePathToTile(current, target)
            : null;
        const actionable = adjacentActionable || Boolean(safePath);

        let nextHoveredPath: stateModule.HexCoord[] | null = null;
        let nextTooltip: TooltipState | null = null;
        let nextTooltipKey: string | null = null;

        if (actionable) {
          nextHoveredPath = safePath && safePath.length > 1 ? safePath : null;

          const enemies = stateModule.getEnemiesAt(current, target);
          const enemyInfo = enemyWorldTooltip(enemies, tile.structure);

          if (enemyInfo) {
            nextTooltipKey = `enemy:${target.q},${target.r}:${tile.structure ?? 'none'}`;
            nextTooltip = {
              title: enemyInfo.title,
              lines: enemyInfo.lines,
              contentKey: nextTooltipKey,
              x: nextTooltipPosition.x,
              y: nextTooltipPosition.y,
              borderColor: tile.structure === 'dungeon' ? '#a855f7' : '#ef4444',
              followCursor: true,
            };
          } else {
            const structureInfo = structureWorldTooltip(tile);
            if (!structureInfo) {
              const nextHoverSnapshot = {
                target,
                clickable: actionable,
                hoveredMove: actionable ? target : null,
                hoveredSafePath: nextHoveredPath,
                tooltip: null,
                tooltipKey: null,
              };
              canvas.style.cursor = actionable ? 'pointer' : 'default';
              hoverSnapshotRef.current = nextHoverSnapshot;
              setCachedHoverSnapshot(
                hoverAnalysisCacheRef.current,
                hoverCacheKey,
                nextHoverSnapshot,
              );
              applyHoverSnapshot({
                hoverSnapshot: nextHoverSnapshot,
                hoveredMoveRef,
                hoveredSafePathRef,
                nextTooltipPosition,
                setTooltip,
                tooltipPositionRef,
                worldTooltipKeyRef,
              });
              return;
            }
            nextTooltipKey = `structure:${target.q},${target.r}:${tile.structure ?? 'none'}`;
            nextTooltip = {
              title: structureInfo.title,
              lines: structureInfo.lines,
              contentKey: nextTooltipKey,
              x: nextTooltipPosition.x,
              y: nextTooltipPosition.y,
              borderColor: '#38bdf8',
              followCursor: true,
            };
          }
        }

        const nextHoverSnapshot = {
          target,
          clickable: actionable,
          hoveredMove: actionable ? target : null,
          hoveredSafePath: nextHoveredPath,
          tooltip: nextTooltip,
          tooltipKey: nextTooltipKey,
        };
        canvas.style.cursor = actionable ? 'pointer' : 'default';
        hoverSnapshotRef.current = nextHoverSnapshot;
        setCachedHoverSnapshot(
          hoverAnalysisCacheRef.current,
          hoverCacheKey,
          nextHoverSnapshot,
        );
        applyHoverSnapshot({
          hoverSnapshot: nextHoverSnapshot,
          hoveredMoveRef,
          hoveredSafePathRef,
          nextTooltipPosition,
          setTooltip,
          tooltipPositionRef,
          worldTooltipKeyRef,
        });
      };

      const onPointerMove = (event: PointerEvent) => {
        const dragState = dragStateRef.current;
        if (dragState && dragState.pointerId === event.pointerId) {
          const deltaX = event.clientX - dragState.startClientX;
          const deltaY = event.clientY - dragState.startClientY;
          if (
            dragState.dragging ||
            Math.hypot(deltaX, deltaY) >= 4
          ) {
            if (!dragState.dragging) {
              dragState.dragging = true;
              clearHoverState();
            }
            const nextCamera = {
              ...worldMapCameraRef.current,
              panX: dragState.startPanX + deltaX,
              panY: dragState.startPanY + deltaY,
            };
            worldMapCameraRef.current = nextCamera;
            applyWorldMapCameraToContainer(
              getSceneCache(app).worldMap,
              app.screen,
              nextCamera,
            );
            canvas.style.cursor = 'grabbing';
            scheduleCameraSave();
          }
          return;
        }

        hoverPointerRef.current = {
          clientX: event.clientX,
          clientY: event.clientY,
        };
        if (hoverFrameRef.current !== null) {
          return;
        }

        hoverFrameRef.current = window.requestAnimationFrame(() => {
          hoverFrameRef.current = null;
          const hoverPointer = hoverPointerRef.current;
          if (!hoverPointer) {
            return;
          }

          processPointerMove(hoverPointer.clientX, hoverPointer.clientY);
        });
      };

      const onPointerLeave = () => {
        dragStateRef.current = null;
        clearHoverState();
      };

      canvas.addEventListener('pointerdown', onPointerDown as EventListener);
      canvas.addEventListener('pointerup', onPointerUp as EventListener);
      canvas.addEventListener('pointercancel', onPointerCancel as EventListener);
      canvas.addEventListener('pointermove', onPointerMove as EventListener);
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('wheel', onWheel as EventListener, {
        passive: false,
      });

      cleanup = () => {
        observer.disconnect();
        window.removeEventListener('resize', resize);
        if (hoverFrameRef.current !== null) {
          window.cancelAnimationFrame(hoverFrameRef.current);
          hoverFrameRef.current = null;
        }
        if (cameraSaveTimerRef.current !== null) {
          window.clearTimeout(cameraSaveTimerRef.current);
          cameraSaveTimerRef.current = null;
        }
        canvas.removeEventListener(
          'pointerdown',
          onPointerDown as EventListener,
        );
        canvas.removeEventListener(
          'pointerup',
          onPointerUp as EventListener,
        );
        canvas.removeEventListener(
          'pointercancel',
          onPointerCancel as EventListener,
        );
        canvas.removeEventListener(
          'pointermove',
          onPointerMove as EventListener,
        );
        canvas.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('wheel', onWheel as EventListener);
        app.ticker.remove(renderFrame);
        app.destroy(true, {
          children: true,
          texture: true,
          textureSource: true,
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
    gameRef,
    setGame,
    setTooltip,
    tooltipPositionRef,
    enabled,
    graphicsSettings,
    worldTimeMsRef,
  ]);

  return { hostRef, canvasReady };
}
