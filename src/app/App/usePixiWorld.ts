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
import { DEFAULT_WORLD_MAP_CAMERA } from '../../ui/world/worldMapCamera';
import {
  getGraphicsRenderResolution,
  type GraphicsSettings,
} from '../graphicsSettings';
import type { TooltipState } from './types';
import { reuseVisibleTilesIfUnchanged } from './selectors/reuseVisibleTilesIfUnchanged';
import {
  createEmptyWorldHoverSnapshot,
  type WorldHoverSnapshot,
} from './usePixiWorldHover';
import type { WorldMapDragState } from './world/pixiWorldInteractions';
import type { WorldRenderSnapshot } from './world/pixiWorldRenderLoop';

interface UsePixiWorldArgs {
  enabled: boolean;
  game: GameState;
  graphicsSettings: GraphicsSettings;
  paused: boolean;
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
  paused,
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
  const dragStateRef = useRef<WorldMapDragState | null>(null);
  const worldMapCameraRef = useRef(DEFAULT_WORLD_MAP_CAMERA);
  const pausedRef = useRef(paused);
  const pausedAnimationMsRef = useRef<number | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const cameraSaveTimerRef = useRef<number | null>(null);
  const selectedRef = useRef(game.player.coord);
  const hoveredMoveRef = useRef<stateModule.HexCoord | null>(null);
  const hoveredSafePathRef = useRef<stateModule.HexCoord[] | null>(null);
  const hoverAnalysisCacheRef = useRef(new Map<string, WorldHoverSnapshot>());
  const hoverSnapshotRef = useRef(createEmptyWorldHoverSnapshot());
  const lastRenderSnapshotRef = useRef<WorldRenderSnapshot>(
    createInitialWorldRenderSnapshot(),
  );
  const renderInvalidationRef = useRef(0);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    gameRef.current = game;
  }, [game, gameRef]);

  useEffect(() => {
    pausedRef.current = paused;
    pausedAnimationMsRef.current = paused ? performance.now() : null;
    renderInvalidationRef.current += 1;
  }, [paused]);

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
    hoverSnapshotRef.current = createEmptyWorldHoverSnapshot();
    renderInvalidationRef.current += 1;
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
    lastRenderSnapshotRef.current = createInitialWorldRenderSnapshot();

    void Promise.all([
      import('./world/pixiWorldCamera'),
      import('./world/pixiWorldInteractions'),
      import('./world/pixiWorldRenderLoop'),
      import('../../ui/world/pixiRuntime'),
      import('../../ui/world/renderScene'),
      import('../../ui/world/worldIcons'),
      import('../../ui/world/worldTooltips'),
      import('../../ui/world/renderSceneCache'),
    ]).then(
      async ([
        cameraModule,
        interactionModule,
        renderLoopModule,
        pixiModule,
        renderSceneModule,
        worldIconsModule,
        worldTooltipsModule,
        sceneCacheModule,
      ]) => {
        if (disposed || !hostRef.current || appRef.current) {
          return;
        }

        const {
          ensureWorldIconTexturesLoaded,
          getVisibleWorldIconAssetIds,
          warmWorldIconTexturesInBackground,
        } = worldIconsModule;
        const { enemyWorldTooltip, structureWorldTooltip } =
          worldTooltipsModule;
        const { getSceneCache } = sceneCacheModule;
        const app = new pixiModule.Application();
        await ensureWorldIconTexturesLoaded(
          getVisibleWorldIconAssetIds(gameRef.current, visibleTilesRef.current),
        );
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
        const getWorldMapContainer = () => getSceneCache(app).worldMap;
        cameraModule.loadSavedWorldMapCamera(worldMapCameraRef);
        hostRef.current.replaceChildren(canvas);

        const resize = cameraModule.createWorldResizeHandler({
          app,
          hostRef,
          graphicsSettings,
          worldMapCameraRef,
          getWorldMapContainer,
        });
        const getScenePoint = cameraModule.createWorldScenePointMapper({
          app,
          canvas,
          worldMapCameraRef,
        });
        const renderFrame = renderLoopModule.createWorldRenderFrame({
          app,
          renderScene: renderSceneModule.renderScene,
          gameRef,
          visibleTilesRef,
          selectedRef,
          hoveredMoveRef,
          hoveredSafePathRef,
          pausedRef,
          pausedAnimationMsRef,
          worldTimeMsRef,
          renderInvalidationRef,
          lastRenderSnapshotRef,
        });

        resize();
        renderFrame();
        app.ticker.add(renderFrame);
        setCanvasReady(true);
        warmWorldIconTexturesInBackground();

        const observer = new ResizeObserver(() => resize());
        observer.observe(hostRef.current);
        window.addEventListener('resize', resize);

        const scheduleCameraSave = cameraModule.createWorldCameraSaveScheduler({
          cameraSaveTimerRef,
          worldMapCameraRef,
        });
        const detachInteractions =
          interactionModule.attachPixiWorldInteractions({
            app,
            canvas,
            enemyWorldTooltip,
            structureWorldTooltip,
            gameRef,
            getScenePoint,
            getWorldMapContainer,
            hoverAnalysisCacheRef,
            hoverFrameRef,
            hoverPointerRef,
            hoverSnapshotRef,
            hoveredMoveRef,
            hoveredSafePathRef,
            pausedRef,
            playerCoordRef,
            selectedRef,
            renderInvalidationRef,
            scheduleCameraSave,
            setGame,
            setTooltip,
            tooltipPositionRef,
            worldMapCameraRef,
            worldTimeMsRef,
            worldTooltipKeyRef,
            dragStateRef,
          });

        cleanup = () => {
          observer.disconnect();
          window.removeEventListener('resize', resize);
          detachInteractions();
          if (cameraSaveTimerRef.current !== null) {
            window.clearTimeout(cameraSaveTimerRef.current);
            cameraSaveTimerRef.current = null;
          }
          app.ticker.remove(renderFrame);
          app.destroy(true, {
            children: true,
            texture: true,
            textureSource: true,
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
    enabled,
    gameRef,
    graphicsSettings,
    setGame,
    setTooltip,
    tooltipPositionRef,
    worldTimeMsRef,
  ]);

  return { hostRef, canvasReady };
}

function createInitialWorldRenderSnapshot(): WorldRenderSnapshot {
  return {
    game: null,
    visibleTiles: null,
    selected: null,
    hoveredMove: null,
    hoveredSafePath: null,
    animationBucket: -1,
    invalidationToken: 0,
  };
}
