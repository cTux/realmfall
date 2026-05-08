import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import type { WorldMovementTransition } from './movement/worldMovementTransition';
import type { WorldMovementController } from './pixiWorldLifecycleTypes';
import {
  autoStartPendingCombat,
  getPendingCombatUpdatePlan,
  getPostCombatAutoStepTransition,
  stampPendingCombatIntro,
  type PendingVictoryTransitionOffset,
} from './pixiWorldPendingCombat';

interface UsePixiWorldPendingCombatSeedLifecycleArgs {
  appRef: MutableRefObject<Application | null>;
  game: GameState;
  movementCooldownEndAtRef: MutableRefObject<number | null>;
  movementControllerRef: MutableRefObject<WorldMovementController | null>;
  pendingVictoryTransitionOffsetRef: MutableRefObject<PendingVictoryTransitionOffset | null>;
  previousGameRef: MutableRefObject<GameState>;
  renderInvalidationRef: MutableRefObject<number>;
}

interface UsePixiWorldPendingCombatIntroLifecycleArgs {
  combat: GameState['combat'];
  combatIntroTimerRef: MutableRefObject<number | null>;
  gameRef: MutableRefObject<GameState>;
  movementTransitionRef: MutableRefObject<WorldMovementTransition | null>;
  paused: boolean;
  playerCoord: HexCoord;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function usePixiWorldPendingCombatSeedLifecycle({
  appRef,
  game,
  movementCooldownEndAtRef,
  movementControllerRef,
  pendingVictoryTransitionOffsetRef,
  previousGameRef,
  renderInvalidationRef,
}: UsePixiWorldPendingCombatSeedLifecycleArgs): void {
  useEffect(() => {
    const previousGame = previousGameRef.current;
    const postCombatAutoStepTransition = getPostCombatAutoStepTransition({
      app: appRef.current,
      game,
      nowMs: performance.now(),
      previousGame,
    });

    if (postCombatAutoStepTransition) {
      pendingVictoryTransitionOffsetRef.current =
        postCombatAutoStepTransition.pendingVictoryTransitionOffset;

      const movementController = movementControllerRef.current;
      if (movementController) {
        movementController.seedCooldownUntil(
          postCombatAutoStepTransition.cooldownEndAtMs,
        );
      } else {
        movementCooldownEndAtRef.current =
          postCombatAutoStepTransition.cooldownEndAtMs;
        renderInvalidationRef.current += 1;
      }
    }

    previousGameRef.current = game;
  }, [
    appRef,
    game,
    movementCooldownEndAtRef,
    movementControllerRef,
    pendingVictoryTransitionOffsetRef,
    previousGameRef,
    renderInvalidationRef,
  ]);
}

export function usePixiWorldPendingCombatIntroLifecycle({
  combat,
  combatIntroTimerRef,
  gameRef,
  movementTransitionRef,
  paused,
  playerCoord,
  setGame,
  worldTimeMsRef,
}: UsePixiWorldPendingCombatIntroLifecycleArgs): void {
  useEffect(() => {
    if (combatIntroTimerRef.current !== null) {
      window.clearTimeout(combatIntroTimerRef.current);
      combatIntroTimerRef.current = null;
    }

    if (paused || !combat) {
      return;
    }

    if (combat.started) {
      return;
    }

    const pendingCombatPlan = getPendingCombatUpdatePlan({
      combat,
      movementNowMs: performance.now(),
      movementTransition: movementTransitionRef.current,
      playerCoord,
      worldTimeMs: worldTimeMsRef.current,
    });
    if (pendingCombatPlan.action === 'none') {
      return;
    }

    const runPendingCombatPlan = () =>
      setGame((current) =>
        pendingCombatPlan.action === 'stamp'
          ? stampPendingCombatIntro({
              current,
              gameRef,
              worldTimeMs: worldTimeMsRef.current,
            })
          : autoStartPendingCombat({
              current,
              gameRef,
              worldTimeMs: worldTimeMsRef.current,
            }),
      );

    if (pendingCombatPlan.delayMs === 0) {
      runPendingCombatPlan();
      return;
    }

    combatIntroTimerRef.current = window.setTimeout(
      runPendingCombatPlan,
      pendingCombatPlan.delayMs,
    );

    return () => {
      if (combatIntroTimerRef.current !== null) {
        window.clearTimeout(combatIntroTimerRef.current);
        combatIntroTimerRef.current = null;
      }
    };
  }, [
    combat,
    combatIntroTimerRef,
    movementTransitionRef,
    paused,
    playerCoord,
    gameRef,
    setGame,
    worldTimeMsRef,
  ]);
}

export function usePixiWorldPendingCombatLifecycle({
  appRef,
  combat,
  game,
  gameRef,
  movementCooldownEndAtRef,
  movementControllerRef,
  movementTransitionRef,
  paused,
  pendingVictoryTransitionOffsetRef,
  playerCoord,
  previousGameRef,
  renderInvalidationRef,
  setGame,
  worldTimeMsRef,
  combatIntroTimerRef,
}: {
  appRef: MutableRefObject<Application | null>;
  combat: GameState['combat'];
  game: GameState;
  gameRef: MutableRefObject<GameState>;
  movementCooldownEndAtRef: MutableRefObject<number | null>;
  movementControllerRef: MutableRefObject<WorldMovementController | null>;
  movementTransitionRef: MutableRefObject<WorldMovementTransition | null>;
  paused: boolean;
  pendingVictoryTransitionOffsetRef: MutableRefObject<PendingVictoryTransitionOffset | null>;
  playerCoord: HexCoord;
  previousGameRef: MutableRefObject<GameState>;
  renderInvalidationRef: MutableRefObject<number>;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
  combatIntroTimerRef: MutableRefObject<number | null>;
}): void {
  usePixiWorldPendingCombatSeedLifecycle({
    appRef,
    game,
    movementCooldownEndAtRef,
    movementControllerRef,
    pendingVictoryTransitionOffsetRef,
    previousGameRef,
    renderInvalidationRef,
  });

  usePixiWorldPendingCombatIntroLifecycle({
    combat,
    combatIntroTimerRef,
    gameRef,
    movementTransitionRef,
    paused,
    playerCoord,
    setGame,
    worldTimeMsRef,
  });
}
