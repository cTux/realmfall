import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import type { GameState, HexCoord } from '@realmfall/core/game/stateTypes';
import { createWorkerGameplayTransitionSource } from '../gameplay/createWorkerGameplayTransitionSource';
import type { GameplayTransitionSource } from '../gameplay/gameplayTransitionSourceTypes';
import type { WorldMovementTransition } from './movement/worldMovementTransition';
import type { WorldMovementController } from './pixiWorldLifecycleTypes';
import {
  createPreviousPendingCombatSnapshot,
  getPendingCombatUpdatePlan,
  getPostCombatAutoStepTransition,
  stampPendingCombatIntro,
  type PendingVictoryTransitionOffset,
  type PreviousPendingCombatSnapshot,
} from './pixiWorldPendingCombat';

interface UsePixiWorldPendingCombatSeedLifecycleArgs {
  appRef: MutableRefObject<Application | null>;
  game: GameState;
  movementCooldownEndAtRef: MutableRefObject<number | null>;
  movementControllerRef: MutableRefObject<WorldMovementController | null>;
  pendingVictoryTransitionOffsetRef: MutableRefObject<PendingVictoryTransitionOffset | null>;
  previousGameRef: MutableRefObject<PreviousPendingCombatSnapshot>;
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
    const previousSnapshot = previousGameRef.current;
    const postCombatAutoStepTransition = getPostCombatAutoStepTransition({
      app: appRef.current,
      game,
      nowMs: performance.now(),
      previousSnapshot,
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

    previousGameRef.current = createPreviousPendingCombatSnapshot(game);
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
  const gameplayTransitionSourceRef = useRef<GameplayTransitionSource>(
    undefined!,
  );
  if (gameplayTransitionSourceRef.current === undefined) {
    gameplayTransitionSourceRef.current =
      createWorkerGameplayTransitionSource();
  }

  useEffect(
    () => () => {
      void gameplayTransitionSourceRef.current.dispose();
    },
    [],
  );

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

    let cancelled = false;
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

    const runPendingCombatPlan = () => {
      if (cancelled) {
        return;
      }

      if (pendingCombatPlan.action === 'stamp') {
        const next = stampPendingCombatIntro({
          current: gameRef.current,
          gameRef,
          worldTimeMs: worldTimeMsRef.current,
        });
        gameRef.current = next;
        setGame(next);
        return;
      }

      void gameplayTransitionSourceRef.current
        .startCombat(gameRef.current, worldTimeMsRef.current)
        .then((result) => {
          if (cancelled) {
            return;
          }

          gameRef.current = result.state;
          setGame(result.state);
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            console.error(error);
          }
        });
    };

    if (pendingCombatPlan.delayMs === 0) {
      runPendingCombatPlan();
      return;
    }

    combatIntroTimerRef.current = window.setTimeout(
      runPendingCombatPlan,
      pendingCombatPlan.delayMs,
    );

    return () => {
      cancelled = true;
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
  previousGameRef: MutableRefObject<PreviousPendingCombatSnapshot>;
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
