import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { t } from '../../../../i18n';
import type { GameState, HexCoord } from '@realmfall/core/game/stateTypes';
import { createWorkerGameplayTransitionSource } from '../../gameplay/createWorkerGameplayTransitionSource';
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

interface ApplyWorldMovementStepOptions {
  engageMode?: 'adjacent-click' | 'staged-click';
  engageTargetCoord?: HexCoord;
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
  const gameplayTransitionSource = createWorkerGameplayTransitionSource();
  const controller = createWorldMovementController({
    moveSource: createLocalWorldMoveSource({ now }),
    now,
    getCurrentCoord: () => gameRef.current.player.coord,
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    clearScheduled: (timerId) => clearTimeout(timerId),
    async applyApprovedStep(
      target: HexCoord,
      options?: ApplyWorldMovementStepOptions,
    ) {
      const timedState = {
        ...gameRef.current,
        worldTimeMs: worldTimeMsRef.current,
      };
      const result = await gameplayTransitionSource.moveToTile(
        timedState,
        target,
        options,
      );
      const nextState = result.changed
        ? createLoggedGameTransition({
            describe: () => t('game.log.command.moveToTile'),
            transition: () => result.state,
          })(timedState)
        : result.state;
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

  return {
    ...controller,
    dispose() {
      controller.dispose();
      void gameplayTransitionSource.dispose();
    },
  };
}
