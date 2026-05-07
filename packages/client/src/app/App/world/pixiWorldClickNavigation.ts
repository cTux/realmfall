import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { hexAtPoint, hexDistance, type HexCoord } from '../../../game/hex';
import { isPassable } from '../../../game/shared';
import { getCurrentWorldRevealRadius } from '../../../game/stateOutposts';
import {
  getSafePathToHostileStagingTile,
  getSafePathToTile,
} from '../../../game/statePathfinding';
import {
  getHostileEnemyIds,
  getResolvedTileAt,
} from '../../../game/stateWorldQueries';
import type { GameState } from '../../../game/stateTypes';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
import type { WorldScenePointMapper } from './pixiWorldCamera';
import {
  getWorldMovementTransitionSceneCenter,
  type WorldMovementTransition,
} from './movement/worldMovementTransition';

interface WorldMovementQueueController {
  queueHostileApproach(
    nextSteps: HexCoord[],
    engageTargetCoord: HexCoord,
  ): void;
  replaceQueuedPath(nextSteps: HexCoord[]): void;
  startHostileEngagement(targetCoord: HexCoord): void;
}

export function createWorldClickHandler({
  app,
  gameRef,
  getScenePoint,
  pausedRef,
  playerCoordRef,
  renderInvalidationRef,
  selectedRef,
  movementTransitionRef,
  movementController,
}: {
  app: Application;
  gameRef: MutableRefObject<GameState>;
  getScenePoint: WorldScenePointMapper;
  pausedRef: MutableRefObject<boolean>;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  selectedRef: MutableRefObject<HexCoord>;
  movementTransitionRef?: MutableRefObject<WorldMovementTransition | null>;
  movementController: WorldMovementQueueController;
}) {
  return (clientX: number, clientY: number) => {
    if (pausedRef.current) {
      return;
    }

    const current = gameRef.current;
    if (current.combat) {
      return;
    }

    const scenePoint = getScenePoint(clientX, clientY);
    const hexSize = getWorldHexSize(app.screen, current.radius);
    const worldCenter = getWorldMovementTransitionSceneCenter({
      hexSize,
      nowMs: performance.now(),
      screen: app.screen,
      transition: movementTransitionRef?.current ?? null,
    });
    const clickedOffset = hexAtPoint(scenePoint.x, scenePoint.y, {
      centerX: worldCenter.x,
      centerY: worldCenter.y,
      size: hexSize,
    });
    const target = {
      q: playerCoordRef.current.q + clickedOffset.q,
      r: playerCoordRef.current.r + clickedOffset.r,
    };
    const distance = hexDistance(playerCoordRef.current, target);
    const revealRadius = getCurrentWorldRevealRadius(current);
    if (distance === 1) {
      const tile = getResolvedTileAt(current, target);
      if (!tile || !isPassable(tile.terrain)) {
        return;
      }

      const hostileEnemyIds = getHostileEnemyIds(current, target);

      selectedRef.current = target;
      renderInvalidationRef.current += 1;
      if (hostileEnemyIds.length > 0) {
        movementController.startHostileEngagement(target);
        return;
      }

      movementController.replaceQueuedPath([target]);
      return;
    }

    if (distance === 0 || distance > revealRadius) {
      return;
    }

    if (!getResolvedTileAt(current, target)) {
      return;
    }

    const hostileEnemyIds = getHostileEnemyIds(current, target);
    if (hostileEnemyIds.length > 0) {
      const stagingPath = getSafePathToHostileStagingTile(current, target);
      if (!stagingPath) {
        return;
      }

      selectedRef.current = target;
      renderInvalidationRef.current += 1;
      movementController.queueHostileApproach(stagingPath, target);
      return;
    }

    const safePath = getSafePathToTile(current, target);
    if (!safePath) {
      return;
    }

    selectedRef.current = target;
    renderInvalidationRef.current += 1;
    movementController.replaceQueuedPath(safePath);
  };
}
