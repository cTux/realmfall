import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '@realmfall/core/game/config';
import { hexDistance } from '@realmfall/core/game/hex';
import type { GameState, HexCoord } from '@realmfall/core/game/stateTypes';
import { getWorldTimeMinutesFromTimestamp } from '@realmfall/core/game/worldTime';
import { getWorldRenderFrameMs } from '../../../ui/world/renderCadence';
import {
  getReachableWorldIconAssetIds,
  getWorldIconTextureVersion,
  warmWorldIconTexturesInBackground,
} from '../../../ui/world/worldIcons';
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';
import {
  DEFAULT_WORLD_RENDER_FPS,
  normalizeCloudTransparency,
  normalizeWorldRenderFps,
} from '../../graphicsSettings';
import { sameCoord } from '../usePixiWorldHover';
import {
  getWorldRenderToken,
  type WorldRenderSnapshot,
} from './worldRenderSnapshot';
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
  getQueuedPath,
  hoveredMoveRef,
  hoveredSafePathRef,
  showCloudsRef,
  cloudTransparencyRef,
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
  getQueuedPath?: () => HexCoord[] | null;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  showCloudsRef?: MutableRefObject<boolean>;
  cloudTransparencyRef?: MutableRefObject<number>;
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
    const currentQueuedPath = getQueuedPath?.() ?? null;
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
    const showClouds = showCloudsRef?.current ?? true;
    const cloudTransparency = normalizeCloudTransparency(
      cloudTransparencyRef?.current ?? 0,
    );
    const showTerrainBackgrounds = showTerrainBackgroundsRef.current;
    const movementCooldownEndAtMs = movementCooldownEndAtRef?.current ?? null;
    const worldRenderToken = getWorldRenderToken(currentGame);
    const rawMovementTransition = movementTransitionRef?.current ?? null;
    const activeMovementTransition = getWorldMovementTransitionRenderState(
      rawMovementTransition,
      wallClockMs,
    );
    const currentMovementTransition =
      activeMovementTransition !== null &&
      !sameCoord(activeMovementTransition.toCoord, currentGame.player.coord)
        ? null
        : activeMovementTransition;
    if (
      rawMovementTransition !== null &&
      currentMovementTransition === null &&
      movementTransitionRef
    ) {
      movementTransitionRef.current = null;
    }
    const movementTransitionRenderToken = getWorldMovementTransitionRenderToken(
      {
        transition: currentMovementTransition,
        nowMs: wallClockMs,
        worldRenderFrameMs,
      },
    );
    const combatActive =
      currentGame.combat?.started === true ||
      currentGame.combat?.startedAtMs != null;
    const movementCooldownRenderToken = combatActive
      ? -1
      : getMovementCooldownRenderToken({
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

    const movedBeforeTransitionRefsUpdated =
      lastRenderSnapshot.previousPlayerCoord !== null &&
      currentMovementTransition === null &&
      (isWaitingForAdjacentMoveTransition({
        currentCoord: currentGame.player.coord,
        movementCooldownEndAtMs,
        previousCoord: lastRenderSnapshot.previousPlayerCoord,
      }) ||
        isWaitingForPostCombatAutoStepTransition({
          currentGameCoord: currentGame.player.coord,
          previousCombatAutoStepOnVictory:
            lastRenderSnapshot.previousCombatAutoStepOnVictory,
          previousCombatAutoStepTargetCoord:
            lastRenderSnapshot.previousCombatAutoStepTargetCoord,
          previousPlayerCoord: lastRenderSnapshot.previousPlayerCoord,
        }));

    if (movedBeforeTransitionRefsUpdated) {
      return;
    }

    if (
      lastRenderSnapshot.worldRenderToken === worldRenderToken &&
      lastRenderSnapshot.visibleTiles === currentVisibleTiles &&
      lastRenderSnapshot.animationBucket === animationBucket &&
      lastRenderSnapshot.invalidationToken === invalidationToken &&
      lastRenderSnapshot.iconTextureVersion === iconTextureVersion &&
      lastRenderSnapshot.movementCooldownEndAtMs === movementCooldownEndAtMs &&
      lastRenderSnapshot.movementCooldownRenderToken ===
        movementCooldownRenderToken &&
      lastRenderSnapshot.movementTransitionRenderToken ===
        movementTransitionRenderToken &&
      lastRenderSnapshot.showClouds === showClouds &&
      lastRenderSnapshot.cloudTransparency === cloudTransparency &&
      lastRenderSnapshot.showTerrainBackgrounds === showTerrainBackgrounds &&
      lastRenderSnapshot.worldRenderFps === worldRenderFps &&
      sameCoord(lastRenderSnapshot.selected, currentSelected) &&
      sameCoordList(lastRenderSnapshot.queuedPath, currentQueuedPath) &&
      sameCoord(lastRenderSnapshot.hoveredMove, currentHoveredMove) &&
      sameCoordList(lastRenderSnapshot.hoveredSafePath, currentHoveredSafePath)
    ) {
      return;
    }

    lastRenderSnapshotRef.current = {
      worldRenderToken,
      visibleTiles: currentVisibleTiles,
      selected: currentSelected,
      queuedPath: currentQueuedPath,
      hoveredMove: currentHoveredMove,
      hoveredSafePath: currentHoveredSafePath,
      animationBucket,
      invalidationToken,
      iconTextureVersion,
      movementCooldownEndAtMs,
      movementCooldownRenderToken,
      movementTransitionRenderToken,
      showClouds,
      cloudTransparency,
      showTerrainBackgrounds,
      worldRenderFps,
      previousPlayerCoord: { ...currentGame.player.coord },
      previousCombatAutoStepOnVictory:
        currentGame.combat?.engagement?.autoStepOnVictory === true,
      previousCombatAutoStepTargetCoord:
        currentGame.combat?.engagement?.targetCoord ?? null,
    };
    const movementCooldown =
      combatActive || movementCooldownEndAtMs === null
        ? null
        : {
            durationMs: WORLD_MOVE_HEX_COOLDOWN_MS,
            endAtMs: movementCooldownEndAtMs,
            nowMs: wallClockMs,
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
      movementCooldown || currentMovementTransition
        ? {
            movementCooldown,
            movementTransition: currentMovementTransition,
            ...(currentQueuedPath ? { queuedPath: currentQueuedPath } : {}),
            showClouds,
            cloudTransparency,
            showTerrainBackgrounds,
            worldTimeMs: worldTimeMsRef.current,
            worldRenderFps,
          }
        : {
            ...(currentQueuedPath ? { queuedPath: currentQueuedPath } : {}),
            showClouds,
            cloudTransparency,
            showTerrainBackgrounds,
            worldTimeMs: worldTimeMsRef.current,
            worldRenderFps,
          },
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

function isWaitingForAdjacentMoveTransition({
  currentCoord,
  movementCooldownEndAtMs,
  previousCoord,
}: {
  currentCoord: HexCoord;
  movementCooldownEndAtMs: number | null;
  previousCoord: HexCoord;
}) {
  return (
    movementCooldownEndAtMs !== null &&
    hexDistance(previousCoord, currentCoord) === 1
  );
}

function isWaitingForPostCombatAutoStepTransition({
  currentGameCoord,
  previousCombatAutoStepOnVictory,
  previousCombatAutoStepTargetCoord,
  previousPlayerCoord,
}: {
  currentGameCoord: HexCoord;
  previousCombatAutoStepOnVictory: boolean;
  previousCombatAutoStepTargetCoord: HexCoord | null;
  previousPlayerCoord: HexCoord;
}) {
  return Boolean(
    previousCombatAutoStepOnVictory &&
    previousCombatAutoStepTargetCoord &&
    !sameCoord(previousPlayerCoord, previousCombatAutoStepTargetCoord) &&
    sameCoord(currentGameCoord, previousCombatAutoStepTargetCoord),
  );
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
