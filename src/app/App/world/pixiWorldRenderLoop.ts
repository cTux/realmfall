import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { getVisibleTiles } from '../../../game/stateSelectors';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { getWorldTimeMinutesFromTimestamp } from '../../../game/worldTime';
import {
  ANIMATED_LAYER_FPS,
  ANIMATED_LAYER_FRAME_MS,
} from '../../../ui/world/renderCadence';
import { getWorldIconTextureVersion } from '../../../ui/world/worldIcons';
import { sameCoord } from '../usePixiWorldHover';
import type { WorldRenderSnapshot } from './worldRenderSnapshot';

type RenderScene = typeof import('../../../ui/world/renderScene').renderScene;

export const WORLD_ANIMATION_FPS = ANIMATED_LAYER_FPS;
const WORLD_ANIMATION_FRAME_MS = ANIMATED_LAYER_FRAME_MS;

export function configureWorldTickerCadence(ticker: { maxFPS: number }) {
  ticker.maxFPS = WORLD_ANIMATION_FPS;
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
    const animationBucket = Math.floor(animationMs / WORLD_ANIMATION_FRAME_MS);
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
    };
    renderScene(
      app,
      currentGame,
      currentVisibleTiles,
      currentSelected,
      currentHoveredMove,
      getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
      animationBucket * WORLD_ANIMATION_FRAME_MS,
      currentHoveredSafePath,
      { showTerrainBackgrounds },
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
