import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { getVisibleTiles } from '../../../game/stateSelectors';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { getWorldTimeMinutesFromTimestamp } from '../../../game/worldTime';
import { getWorldRenderFrameMs } from '../../../ui/world/renderCadence';
import { getWorldIconTextureVersion } from '../../../ui/world/worldIcons';
import {
  DEFAULT_WORLD_RENDER_FPS,
  normalizeWorldRenderFps,
} from '../../graphicsSettings';
import { sameCoord } from '../usePixiWorldHover';
import type { WorldRenderSnapshot } from './worldRenderSnapshot';

type RenderScene = typeof import('../../../ui/world/renderScene').renderScene;

export const WORLD_ANIMATION_FPS = DEFAULT_WORLD_RENDER_FPS;

export function configureWorldTickerCadence(
  ticker: { maxFPS: number },
  worldRenderFps = DEFAULT_WORLD_RENDER_FPS,
) {
  ticker.maxFPS = normalizeWorldRenderFps(worldRenderFps);
}

export function createWorldRenderFrame({
  app,
  renderScene,
  gameRef,
  visibleTilesRef,
  selectedRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  showTerrainBackgroundsRef,
  worldRenderFpsRef,
  pausedRef,
  pausedAnimationMsRef,
  worldTimeMsRef,
  renderInvalidationRef,
  lastRenderSnapshotRef,
}: {
  app: Application;
  renderScene: RenderScene;
  gameRef: MutableRefObject<GameState>;
  visibleTilesRef: MutableRefObject<ReturnType<typeof getVisibleTiles>>;
  selectedRef: MutableRefObject<HexCoord>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  showTerrainBackgroundsRef: MutableRefObject<boolean>;
  worldRenderFpsRef: MutableRefObject<number>;
  pausedRef: MutableRefObject<boolean>;
  pausedAnimationMsRef: MutableRefObject<number | null>;
  worldTimeMsRef: MutableRefObject<number>;
  renderInvalidationRef: MutableRefObject<number>;
  lastRenderSnapshotRef: MutableRefObject<WorldRenderSnapshot>;
}) {
  return () => {
    const currentGame = gameRef.current;
    const currentVisibleTiles = visibleTilesRef.current;
    const currentSelected = selectedRef.current;
    const currentHoveredMove = hoveredMoveRef.current;
    const currentHoveredSafePath = hoveredSafePathRef.current;
    const animationMs = pausedRef.current
      ? (pausedAnimationMsRef.current ?? performance.now())
      : performance.now();
    const worldRenderFps = normalizeWorldRenderFps(worldRenderFpsRef.current);
    const worldRenderFrameMs = getWorldRenderFrameMs(worldRenderFps);
    const animationBucket = Math.floor(animationMs / worldRenderFrameMs);
    const lastRenderSnapshot = lastRenderSnapshotRef.current;
    const invalidationToken = renderInvalidationRef.current;
    const iconTextureVersion = getWorldIconTextureVersion();
    const showTerrainBackgrounds = showTerrainBackgroundsRef.current;

    if (
      lastRenderSnapshot.game === currentGame &&
      lastRenderSnapshot.visibleTiles === currentVisibleTiles &&
      lastRenderSnapshot.animationBucket === animationBucket &&
      lastRenderSnapshot.invalidationToken === invalidationToken &&
      lastRenderSnapshot.iconTextureVersion === iconTextureVersion &&
      lastRenderSnapshot.showTerrainBackgrounds === showTerrainBackgrounds &&
      lastRenderSnapshot.worldRenderFps === worldRenderFps &&
      sameCoord(lastRenderSnapshot.selected, currentSelected) &&
      sameCoord(lastRenderSnapshot.hoveredMove, currentHoveredMove) &&
      sameCoordList(lastRenderSnapshot.hoveredSafePath, currentHoveredSafePath)
    ) {
      return;
    }

    lastRenderSnapshotRef.current = {
      game: currentGame,
      visibleTiles: currentVisibleTiles,
      selected: currentSelected,
      hoveredMove: currentHoveredMove,
      hoveredSafePath: currentHoveredSafePath,
      animationBucket,
      invalidationToken,
      iconTextureVersion,
      showTerrainBackgrounds,
      worldRenderFps,
    };
    renderScene(
      app,
      currentGame,
      currentVisibleTiles,
      currentSelected,
      currentHoveredMove,
      getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
      animationBucket * worldRenderFrameMs,
      currentHoveredSafePath,
      { showTerrainBackgrounds, worldRenderFps },
    );
  };
}

function sameCoordList(left: HexCoord[] | null, right: HexCoord[] | null) {
  if (left === right) {
    return true;
  }

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return left.every((coord, index) => sameCoord(coord, right[index] ?? null));
}
