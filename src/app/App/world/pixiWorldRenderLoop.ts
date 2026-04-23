import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { getVisibleTiles } from '../../../game/stateSelectors';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { getWorldTimeMinutesFromTimestamp } from '../../../game/worldTime';
import type { SceneCache } from '../../../ui/world/renderSceneCache';
import { getSceneRenderTokens } from '../../../ui/world/renderSceneTokens';
import { sameCoord } from '../usePixiWorldHover';

type RenderScene = typeof import('../../../ui/world/renderScene').renderScene;

export interface WorldRenderSnapshot {
  visibleTiles: ReturnType<typeof getVisibleTiles> | null;
  selected: HexCoord | null;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  animationBucket: number;
  invalidationToken: number;
  staticRenderToken: number | null;
  interactionRenderToken: number | null;
  screenWidth: number;
  screenHeight: number;
  showTerrainBackgrounds: boolean;
  derivedRenderVisibleTilesSource: SceneCache['derivedRenderVisibleTilesSource'];
  derivedRenderEnemiesSource: SceneCache['derivedRenderEnemiesSource'];
  derivedRenderVisibleEnemyToken: SceneCache['derivedRenderVisibleEnemyToken'];
  derivedRenderPlayerCoordKey: SceneCache['derivedRenderPlayerCoordKey'];
  derivedRenderHomeHexKey: SceneCache['derivedRenderHomeHexKey'];
  derivedRenderBloodMoonActive: SceneCache['derivedRenderBloodMoonActive'];
  derivedRenderIconTextureVersion: SceneCache['derivedRenderIconTextureVersion'];
  derivedStaticRenderToken: SceneCache['derivedStaticRenderToken'];
  derivedInteractionRenderToken: SceneCache['derivedInteractionRenderToken'];
}

const WORLD_ANIMATION_FPS = 30;
const WORLD_ANIMATION_FRAME_MS = 1000 / WORLD_ANIMATION_FPS;

export function createWorldRenderSnapshot(): WorldRenderSnapshot {
  return {
    visibleTiles: null,
    selected: null,
    hoveredMove: null,
    hoveredSafePath: null,
    animationBucket: -1,
    invalidationToken: 0,
    staticRenderToken: null,
    interactionRenderToken: null,
    screenWidth: -1,
    screenHeight: -1,
    showTerrainBackgrounds: true,
    derivedRenderVisibleTilesSource: null,
    derivedRenderEnemiesSource: null,
    derivedRenderVisibleEnemyToken: null,
    derivedRenderPlayerCoordKey: null,
    derivedRenderHomeHexKey: null,
    derivedRenderBloodMoonActive: null,
    derivedRenderIconTextureVersion: null,
    derivedStaticRenderToken: null,
    derivedInteractionRenderToken: null,
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
  renderTokenCache,
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
  renderTokenCache: Pick<
    SceneCache,
    | 'derivedRenderVisibleTilesSource'
    | 'derivedRenderEnemiesSource'
    | 'derivedRenderVisibleEnemyToken'
    | 'derivedRenderPlayerCoordKey'
    | 'derivedRenderHomeHexKey'
    | 'derivedRenderBloodMoonActive'
    | 'derivedRenderIconTextureVersion'
    | 'derivedStaticRenderToken'
    | 'derivedInteractionRenderToken'
  >;
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
    const showTerrainBackgrounds = showTerrainBackgroundsRef.current;
    const renderTokens = getSceneRenderTokens(
      renderTokenCache,
      currentGame,
      currentVisibleTiles,
    );
    const iconTextureVersion =
      renderTokenCache.derivedRenderIconTextureVersion ?? 0;
    const staticRenderToken = renderTokens.static;
    const interactionRenderToken = renderTokens.interactionWithSelection(
      currentSelected,
      currentHoveredMove,
      currentHoveredSafePath,
    );
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    if (
      lastRenderSnapshot.visibleTiles === currentVisibleTiles &&
      lastRenderSnapshot.animationBucket === animationBucket &&
      lastRenderSnapshot.invalidationToken === invalidationToken &&
      lastRenderSnapshot.staticRenderToken === staticRenderToken &&
      lastRenderSnapshot.interactionRenderToken === interactionRenderToken &&
      lastRenderSnapshot.derivedRenderIconTextureVersion ===
        iconTextureVersion &&
      lastRenderSnapshot.screenWidth === screenWidth &&
      lastRenderSnapshot.screenHeight === screenHeight &&
      lastRenderSnapshot.showTerrainBackgrounds === showTerrainBackgrounds &&
      sameCoord(lastRenderSnapshot.selected, currentSelected) &&
      sameCoord(lastRenderSnapshot.hoveredMove, currentHoveredMove) &&
      sameCoordList(lastRenderSnapshot.hoveredSafePath, currentHoveredSafePath)
    ) {
      return;
    }

    lastRenderSnapshotRef.current = {
      visibleTiles: currentVisibleTiles,
      selected: currentSelected,
      hoveredMove: currentHoveredMove,
      hoveredSafePath: currentHoveredSafePath,
      animationBucket,
      invalidationToken,
      staticRenderToken,
      interactionRenderToken,
      screenWidth,
      screenHeight,
      showTerrainBackgrounds,
      derivedRenderVisibleTilesSource:
        renderTokenCache.derivedRenderVisibleTilesSource,
      derivedRenderEnemiesSource: renderTokenCache.derivedRenderEnemiesSource,
      derivedRenderVisibleEnemyToken:
        renderTokenCache.derivedRenderVisibleEnemyToken,
      derivedRenderPlayerCoordKey: renderTokenCache.derivedRenderPlayerCoordKey,
      derivedRenderHomeHexKey: renderTokenCache.derivedRenderHomeHexKey,
      derivedRenderBloodMoonActive:
        renderTokenCache.derivedRenderBloodMoonActive,
      derivedRenderIconTextureVersion:
        renderTokenCache.derivedRenderIconTextureVersion,
      derivedStaticRenderToken: renderTokenCache.derivedStaticRenderToken,
      derivedInteractionRenderToken:
        renderTokenCache.derivedInteractionRenderToken,
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
