import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { t } from '../../../../i18n';
import { moveToTile } from '../../../../game/stateMovement';
import type { GameState, HexCoord } from '../../../../game/stateTypes';
import { createLoggedGameTransition } from '../../hooks/useLoggedGameCommand';
import { createLocalWorldMoveSource } from './createLocalWorldMoveSource';
import {
  createWorldMovementController,
  type WorldMovementAutoOpenSuppressionState,
} from './worldMovementController';

interface CreateAppWorldMovementControllerArgs {
  gameRef: MutableRefObject<GameState>;
  now?: () => number;
  onAutoOpenSuppressionStateChange?: (
    state: WorldMovementAutoOpenSuppressionState,
  ) => void;
  renderInvalidationRef: MutableRefObject<number>;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
  movementCooldownEndAtRef: MutableRefObject<number | null>;
}

export function createAppWorldMovementController({
  gameRef,
  now = () => performance.now(),
  onAutoOpenSuppressionStateChange = () => undefined,
  renderInvalidationRef,
  setGame,
  worldTimeMsRef,
  movementCooldownEndAtRef,
}: CreateAppWorldMovementControllerArgs) {
  return createWorldMovementController({
    moveSource: createLocalWorldMoveSource({ now }),
    now,
    getCurrentCoord: () => gameRef.current.player.coord,
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    clearScheduled: (timerId) => clearTimeout(timerId),
    applyApprovedStep: (target: HexCoord) => {
      const nextState = createLoggedGameTransition({
        describe: () => t('game.log.command.moveToTile'),
        transition: (timedState) => moveToTile(timedState, target),
      })({
        ...gameRef.current,
        worldTimeMs: worldTimeMsRef.current,
      });
      gameRef.current = nextState;
      worldTimeMsRef.current = nextState.worldTimeMs;
      setGame(nextState);

      return {
        combatStarted: nextState.combat != null,
      };
    },
    onCooldownChange: (endAtMs) => {
      movementCooldownEndAtRef.current = endAtMs;
      renderInvalidationRef.current += 1;
    },
    onAutoOpenSuppressionStateChange,
  });
}
