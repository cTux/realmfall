import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Application } from 'pixi.js';
import { hexAtPoint, hexDistance, type HexCoord } from '../../../game/hex';
import { isPassable } from '../../../game/shared';
import { moveAlongSafePath, moveToTile } from '../../../game/stateMovement';
import { getSafePathToTile } from '../../../game/statePathfinding';
import { getTileAt } from '../../../game/stateWorldQueries';
import type { GameState } from '../../../game/stateTypes';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
import { WORLD_REVEAL_RADIUS } from '../../constants';
import type { WorldScenePointMapper } from './pixiWorldCamera';

export function createWorldClickHandler({
  app,
  gameRef,
  getScenePoint,
  pausedRef,
  playerCoordRef,
  renderInvalidationRef,
  selectedRef,
  setGame,
  worldTimeMsRef,
}: {
  app: Application;
  gameRef: MutableRefObject<GameState>;
  getScenePoint: WorldScenePointMapper;
  pausedRef: MutableRefObject<boolean>;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  selectedRef: MutableRefObject<HexCoord>;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}) {
  return (clientX: number, clientY: number) => {
    if (pausedRef.current) {
      return;
    }

    const scenePoint = getScenePoint(clientX, clientY);
    const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
    const clickedOffset = hexAtPoint(scenePoint.x, scenePoint.y, {
      centerX: app.screen.width / 2,
      centerY: app.screen.height / 2,
      size: hexSize,
    });
    const target = {
      q: playerCoordRef.current.q + clickedOffset.q,
      r: playerCoordRef.current.r + clickedOffset.r,
    };
    const current = gameRef.current;
    const distance = hexDistance(playerCoordRef.current, target);
    if (distance === 1) {
      const tile = getTileAt(current, target);
      if (!isPassable(tile.terrain)) {
        return;
      }

      selectedRef.current = target;
      renderInvalidationRef.current += 1;
      setGame((currentState) =>
        moveToTile(
          { ...currentState, worldTimeMs: worldTimeMsRef.current },
          target,
        ),
      );
      return;
    }

    if (distance === 0 || distance > WORLD_REVEAL_RADIUS) {
      return;
    }

    const safePath = getSafePathToTile(current, target);
    if (!safePath) {
      return;
    }

    selectedRef.current = target;
    renderInvalidationRef.current += 1;
    setGame((currentState) =>
      moveAlongSafePath(
        { ...currentState, worldTimeMs: worldTimeMsRef.current },
        target,
      ),
    );
  };
}
