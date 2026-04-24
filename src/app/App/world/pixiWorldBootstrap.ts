import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Application } from 'pixi.js';
import type { getVisibleTiles } from '../../../game/stateSelectors';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';
import type { WorldMapCameraState } from '../../../ui/world/worldMapCamera';
import {
  getGraphicsRenderResolution,
  type GraphicsSettings,
} from '../../graphicsSettings';
import type { TooltipState } from '../types';
import type { WorldHoverSnapshot } from '../usePixiWorldHover';
import type { WorldMapDragState } from './pixiWorldInteractions';
import type { WorldRenderSnapshot } from './worldRenderSnapshot';

export type PixiWorldInitGraphicsSettings = Pick<
  GraphicsSettings,
  | 'antialias'
  | 'autoDensity'
  | 'clearBeforeRender'
  | 'premultipliedAlpha'
  | 'preserveDrawingBuffer'
  | 'resolutionCap'
  | 'useContextAlpha'
>;

type PixiWorldCleanup = () => void;

interface BootstrapPixiWorldCanvasArgs {
  appRef: MutableRefObject<Application | null>;
  cameraSaveTimerRef: MutableRefObject<number | null>;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
  gameRef: MutableRefObject<GameState>;
  hostRef: MutableRefObject<HTMLDivElement | null>;
  hoverAnalysisCacheRef: MutableRefObject<Map<string, WorldHoverSnapshot>>;
  hoverFrameRef: MutableRefObject<number | null>;
  hoverPointerRef: MutableRefObject<{
    clientX: number;
    clientY: number;
  } | null>;
  hoverSnapshotRef: MutableRefObject<WorldHoverSnapshot>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  initGraphicsSettings: PixiWorldInitGraphicsSettings;
  isDisposed: () => boolean;
  lastRenderSnapshotRef: MutableRefObject<WorldRenderSnapshot>;
  onReady: (cleanup: PixiWorldCleanup) => void;
  pausedAnimationMsRef: MutableRefObject<number | null>;
  pausedRef: MutableRefObject<boolean>;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  selectedRef: MutableRefObject<HexCoord>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
  showTerrainBackgroundsRef: MutableRefObject<boolean>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  visibleTilesRef: MutableRefObject<ReturnType<typeof getVisibleTiles>>;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
  worldTimeMsRef: MutableRefObject<number>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
}

export async function bootstrapPixiWorldCanvas({
  appRef,
  cameraSaveTimerRef,
  dragStateRef,
  gameRef,
  hostRef,
  hoverAnalysisCacheRef,
  hoverFrameRef,
  hoverPointerRef,
  hoverSnapshotRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  initGraphicsSettings,
  isDisposed,
  lastRenderSnapshotRef,
  onReady,
  pausedAnimationMsRef,
  pausedRef,
  playerCoordRef,
  renderInvalidationRef,
  selectedRef,
  setGame,
  setTooltip,
  showTerrainBackgroundsRef,
  tooltipPositionRef,
  visibleTilesRef,
  worldMapCameraRef,
  worldTimeMsRef,
  worldTooltipKeyRef,
}: BootstrapPixiWorldCanvasArgs) {
  const [
    cameraModule,
    interactionModule,
    renderLoopModule,
    pixiModule,
    renderSceneModule,
    worldIconsModule,
    worldTooltipsModule,
    sceneCacheModule,
    tickerVisibilityModule,
  ] = await Promise.all([
    import('./pixiWorldCamera'),
    import('./pixiWorldInteractions'),
    import('./pixiWorldRenderLoop'),
    import('../../../ui/world/pixiRuntime'),
    import('../../../ui/world/renderScene'),
    import('../../../ui/world/worldIcons'),
    import('../../../ui/world/worldTooltips'),
    import('../../../ui/world/renderSceneCache'),
    import('./pixiWorldTickerVisibility'),
  ]);

  if (isDisposed() || !hostRef.current || appRef.current) {
    return;
  }

  const {
    antialias,
    autoDensity,
    clearBeforeRender,
    premultipliedAlpha,
    preserveDrawingBuffer,
    resolutionCap,
    useContextAlpha,
  } = initGraphicsSettings;
  const {
    ensureWorldIconTexturesLoaded,
    getVisibleWorldIconAssetIds,
    warmWorldIconTexturesInBackground,
  } = worldIconsModule;
  const { enemyWorldTooltip, structureWorldTooltip } = worldTooltipsModule;
  const { getSceneCache } = sceneCacheModule;

  await ensureWorldIconTexturesLoaded(
    getVisibleWorldIconAssetIds(
      gameRef.current.enemies,
      visibleTilesRef.current,
    ),
  );

  const app = new pixiModule.Application();
  try {
    await app.init({
      width: Math.max(window.innerWidth, 640),
      height: Math.max(window.innerHeight, 480),
      backgroundColor: 0x0b1020,
      backgroundAlpha: useContextAlpha ? 0 : 1,
      antialias,
      autoDensity,
      clearBeforeRender,
      manageImports: false,
      preserveDrawingBuffer,
      premultipliedAlpha,
      preference: 'webgl',
      resolution: getGraphicsRenderResolution(
        { resolutionCap },
        window.devicePixelRatio,
      ),
    });
  } catch (error) {
    destroyPixiApplication(app);
    throw error;
  }

  if (isDisposed() || !hostRef.current || appRef.current) {
    destroyPixiApplication(app);
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
    resolutionCap,
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
    showTerrainBackgroundsRef,
    pausedRef,
    pausedAnimationMsRef,
    worldTimeMsRef,
    renderInvalidationRef,
    lastRenderSnapshotRef,
  });

  resize();
  renderLoopModule.configureWorldTickerCadence(app.ticker);
  renderFrame();
  app.ticker.add(renderFrame);
  const detachTickerVisibilityPause =
    tickerVisibilityModule.attachPixiWorldTickerVisibilityPause({
      ticker: app.ticker,
      renderFrame,
      renderInvalidationRef,
    });

  const observer = new ResizeObserver(() => resize());
  observer.observe(hostRef.current);
  window.addEventListener('resize', resize);

  const scheduleCameraSave = cameraModule.createWorldCameraSaveScheduler({
    cameraSaveTimerRef,
    worldMapCameraRef,
  });
  const detachInteractions = interactionModule.attachPixiWorldInteractions({
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

  onReady(() => {
    observer.disconnect();
    window.removeEventListener('resize', resize);
    detachInteractions();
    if (cameraSaveTimerRef.current !== null) {
      window.clearTimeout(cameraSaveTimerRef.current);
      cameraSaveTimerRef.current = null;
    }
    detachTickerVisibilityPause();
    app.ticker.remove(renderFrame);
    destroyPixiApplication(app);
    appRef.current = null;
  });
  warmWorldIconTexturesInBackground();
}

function destroyPixiApplication(app: Application) {
  app.destroy(true, {
    children: true,
    texture: true,
    textureSource: true,
  });
}
