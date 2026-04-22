import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import * as stateModule from '../../../game/state';
import { getWorldTimeMinutesFromTimestamp } from '../../../game/worldTime';
import { getWorldIconTextureVersion } from '../../../ui/world/worldIcons';
import { sameCoord } from '../usePixiWorldHover';

type RenderScene = typeof import('../../../ui/world/renderScene').renderScene;

export interface WorldRenderSnapshot {
  game: stateModule.GameState | null;
  visibleTiles: ReturnType<typeof stateModule.getVisibleTiles> | null;
  selected: stateModule.HexCoord | null;
  hoveredMove: stateModule.HexCoord | null;
  hoveredSafePath: stateModule.HexCoord[] | null;
  animationBucket: number;
  invalidationToken: number;
  iconTextureVersion: number;
  showTerrainBackgrounds: boolean;
}

const WORLD_ANIMATION_FPS = 30;
const WORLD_ANIMATION_FRAME_MS = 1000 / WORLD_ANIMATION_FPS;

export function createWorldRenderSnapshot(): WorldRenderSnapshot {
  return {
    game: null,
    visibleTiles: null,
    selected: null,
    hoveredMove: null,
    hoveredSafePath: null,
    animationBucket: -1,
    invalidationToken: 0,
    iconTextureVersion: getWorldIconTextureVersion(),
    showTerrainBackgrounds: true,
  };
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
  gameRef: MutableRefObject<stateModule.GameState>;
  visibleTilesRef: MutableRefObject<
    ReturnType<typeof stateModule.getVisibleTiles>
  >;
  selectedRef: MutableRefObject<stateModule.HexCoord>;
  hoveredMoveRef: MutableRefObject<stateModule.HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<stateModule.HexCoord[] | null>;
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

function sameCoordList(
  left: stateModule.HexCoord[] | null,
  right: stateModule.HexCoord[] | null,
) {
  if (left === right) {
    return true;
  }

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return left.every((coord, index) => sameCoord(coord, right[index] ?? null));
}
