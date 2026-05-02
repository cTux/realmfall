import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../../game/config';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { getWorldTimeMinutesFromTimestamp } from '../../../game/worldTime';
import { getWorldRenderFrameMs } from '../../../ui/world/renderCadence';
import {
  getReachableWorldIconAssetIds,
  getWorldIconTextureVersion,
  warmWorldIconTexturesInBackground,
} from '../../../ui/world/worldIcons';
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';
import {
  DEFAULT_WORLD_RENDER_FPS,
  normalizeWorldRenderFps,
} from '../../graphicsSettings';
import { sameCoord } from '../usePixiWorldHover';
import type { WorldRenderSnapshot } from './worldRenderSnapshot';
import {
  getWorldMovementTransitionRenderState,
  getWorldMovementTransitionRenderToken,
  type WorldMovementTransition,
} from './movement/worldMovementTransition';

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
  movementCooldownEndAtRef,
  movementTransitionRef,
}: {
  app: Application;
  renderScene: RenderScene;
  gameRef: MutableRefObject<GameState>;
  visibleTilesRef: MutableRefObject<VisibleWorldTile[]>;
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
  movementCooldownEndAtRef?: MutableRefObject<number | null>;
  movementTransitionRef?: MutableRefObject<WorldMovementTransition | null>;
}) {
  let lastReachableWarmPlayerCoord = { ...gameRef.current.player.coord };
  let lastReachableWarmRadius = gameRef.current.radius;

  return () => {
    const currentGame = gameRef.current;
    const currentVisibleTiles = visibleTilesRef.current;
    const currentSelected = selectedRef.current;
    const currentHoveredMove = hoveredMoveRef.current;
    const currentHoveredSafePath = hoveredSafePathRef.current;
    const wallClockMs = performance.now();
    const animationMs = pausedRef.current
      ? (pausedAnimationMsRef.current ?? wallClockMs)
      : wallClockMs;
    const worldRenderFps = normalizeWorldRenderFps(worldRenderFpsRef.current);
    const worldRenderFrameMs = getWorldRenderFrameMs(worldRenderFps);
    const animationBucket = Math.floor(animationMs / worldRenderFrameMs);
    const lastRenderSnapshot = lastRenderSnapshotRef.current;
    const invalidationToken = renderInvalidationRef.current;
    const iconTextureVersion = getWorldIconTextureVersion();
    const showTerrainBackgrounds = showTerrainBackgroundsRef.current;
    const movementCooldownEndAtMs = movementCooldownEndAtRef?.current ?? null;
    const movementTransitionRenderToken = getWorldMovementTransitionRenderToken(
      {
        transition: movementTransitionRef?.current ?? null,
        nowMs: wallClockMs,
        worldRenderFrameMs,
      },
    );
    const movementCooldownRenderToken = getMovementCooldownRenderToken({
      endAtMs: movementCooldownEndAtMs,
      nowMs: wallClockMs,
      worldRenderFrameMs,
    });

    if (
      !sameCoord(lastReachableWarmPlayerCoord, currentGame.player.coord) ||
      lastReachableWarmRadius !== currentGame.radius
    ) {
      warmWorldIconTexturesInBackground(
        getReachableWorldIconAssetIds(currentGame),
      );
      lastReachableWarmPlayerCoord = { ...currentGame.player.coord };
      lastReachableWarmRadius = currentGame.radius;
    }

    if (
      lastRenderSnapshot.game === currentGame &&
      lastRenderSnapshot.visibleTiles === currentVisibleTiles &&
      lastRenderSnapshot.animationBucket === animationBucket &&
      lastRenderSnapshot.invalidationToken === invalidationToken &&
      lastRenderSnapshot.iconTextureVersion === iconTextureVersion &&
      lastRenderSnapshot.movementCooldownEndAtMs === movementCooldownEndAtMs &&
      lastRenderSnapshot.movementCooldownRenderToken ===
        movementCooldownRenderToken &&
      lastRenderSnapshot.movementTransitionRenderToken ===
        movementTransitionRenderToken &&
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
      movementCooldownEndAtMs,
      movementCooldownRenderToken,
      movementTransitionRenderToken,
      showTerrainBackgrounds,
      worldRenderFps,
    };
    const movementCooldown =
      movementCooldownEndAtMs === null
        ? null
        : {
            durationMs: WORLD_MOVE_HEX_COOLDOWN_MS,
            endAtMs: movementCooldownEndAtMs,
            nowMs: wallClockMs,
          };
    const movementTransition = getWorldMovementTransitionRenderState(
      movementTransitionRef?.current ?? null,
      wallClockMs,
    );

    renderScene(
      app,
      currentGame,
      currentVisibleTiles,
      currentSelected,
      currentHoveredMove,
      getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
      animationBucket * worldRenderFrameMs,
      currentHoveredSafePath,
      movementCooldown || movementTransition
        ? {
            movementCooldown,
            movementTransition,
            showTerrainBackgrounds,
            worldRenderFps,
          }
        : { showTerrainBackgrounds, worldRenderFps },
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

function getMovementCooldownRenderToken({
  endAtMs,
  nowMs,
  worldRenderFrameMs,
}: {
  endAtMs: number | null;
  nowMs: number;
  worldRenderFrameMs: number;
}) {
  if (endAtMs === null) {
    return -1;
  }

  return Math.max(0, Math.ceil((endAtMs - nowMs) / worldRenderFrameMs));
}
