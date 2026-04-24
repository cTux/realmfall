import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import { getVisibleTiles } from '../../game/stateSelectors';
import type { GameState, HexCoord } from '../../game/stateTypes';
import type { TooltipPosition } from '../../ui/components/GameTooltip';
import { DEFAULT_WORLD_MAP_CAMERA } from '../../ui/world/worldMapCamera';
import type { GraphicsSettings } from '../graphicsSettings';
import type { TooltipState } from './types';
import { reuseVisibleTilesIfUnchanged } from './selectors/reuseVisibleTilesIfUnchanged';
import {
  createEmptyWorldHoverSnapshot,
  type WorldHoverSnapshot,
} from './usePixiWorldHover';
import type { WorldMapDragState } from './world/pixiWorldInteractions';
import type { PixiWorldInitGraphicsSettings } from './world/pixiWorldBootstrap';
import {
  createInitialWorldRenderSnapshot,
  type WorldRenderSnapshot,
} from './world/worldRenderSnapshot';

type VisibleTiles = ReturnType<typeof getVisibleTiles>;

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
  const { showTerrainBackgrounds } = graphicsSettings;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const initGraphicsSettingsRef = useRef<PixiWorldInitGraphicsSettings | null>(
    null,
  );
  const worldTooltipKeyRef = useRef<string | null>(null);
  const playerCoordRef = useRef(game.player.coord);
  const visibleTilesRef = useRef<VisibleTiles>(undefined!);
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
  const hoveredMoveRef = useRef<HexCoord | null>(null);
  const hoveredSafePathRef = useRef<HexCoord[] | null>(null);
  const hoverAnalysisCacheRef = useRef<Map<string, WorldHoverSnapshot>>(
    undefined!,
  );
  const hoverSnapshotRef = useRef<WorldHoverSnapshot>(undefined!);
  const showTerrainBackgroundsRef = useRef(showTerrainBackgrounds);
  const lastRenderSnapshotRef = useRef<WorldRenderSnapshot>(undefined!);
  const renderInvalidationRef = useRef(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const retryCanvas = useCallback(() => {
    setCanvasReady(false);
    setCanvasError(false);
    setBootstrapAttempt((current) => current + 1);
  }, []);

  if (visibleTilesRef.current === undefined) {
    visibleTilesRef.current = getVisibleTiles(game);
  }

  if (hoverAnalysisCacheRef.current === undefined) {
    hoverAnalysisCacheRef.current = new Map<string, WorldHoverSnapshot>();
  }

  if (hoverSnapshotRef.current === undefined) {
    hoverSnapshotRef.current = createEmptyWorldHoverSnapshot();
  }

  if (lastRenderSnapshotRef.current === undefined) {
    lastRenderSnapshotRef.current = createInitialWorldRenderSnapshot();
  }

  if (initGraphicsSettingsRef.current === null) {
    initGraphicsSettingsRef.current =
      getPixiInitGraphicsSettings(graphicsSettings);
  }

  useEffect(() => {
    gameRef.current = game;
  }, [game, gameRef]);

  useEffect(() => {
    pausedRef.current = paused;
    pausedAnimationMsRef.current = paused ? performance.now() : null;
    renderInvalidationRef.current += 1;
  }, [paused]);

  useEffect(() => {
    showTerrainBackgroundsRef.current = showTerrainBackgrounds;
    renderInvalidationRef.current += 1;
  }, [showTerrainBackgrounds]);

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
    const initGraphicsSettings = initGraphicsSettingsRef.current!;
    lastRenderSnapshotRef.current = createInitialWorldRenderSnapshot();
    setCanvasReady(false);
    setCanvasError(false);

    void import('./world/pixiWorldBootstrap')
      .then(({ bootstrapPixiWorldCanvas }) =>
        bootstrapPixiWorldCanvas({
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
          isDisposed: () => disposed,
          lastRenderSnapshotRef,
          onReady: (nextCleanup) => {
            cleanup = () => {
              nextCleanup();
              setCanvasReady(false);
            };
            setCanvasReady(true);
          },
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
        }),
      )
      .catch((error: unknown) => {
        if (disposed) return;
        console.error(error);
        cleanup?.();
        appRef.current = null;
        setCanvasReady(false);
        setCanvasError(true);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [
    bootstrapAttempt,
    enabled,
    gameRef,
    setGame,
    setTooltip,
    tooltipPositionRef,
    worldTimeMsRef,
  ]);

  return { hostRef, canvasReady, canvasError, retryCanvas };
}

function getPixiInitGraphicsSettings(
  graphicsSettings: GraphicsSettings,
): PixiWorldInitGraphicsSettings {
  return {
    antialias: graphicsSettings.antialias,
    autoDensity: graphicsSettings.autoDensity,
    clearBeforeRender: graphicsSettings.clearBeforeRender,
    premultipliedAlpha: graphicsSettings.premultipliedAlpha,
    preserveDrawingBuffer: graphicsSettings.preserveDrawingBuffer,
    resolutionCap: graphicsSettings.resolutionCap,
    useContextAlpha: graphicsSettings.useContextAlpha,
  };
}
