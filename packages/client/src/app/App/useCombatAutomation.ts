import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { createWorkerGameplayTransitionSource } from './gameplay/createWorkerGameplayTransitionSource';
import { getCombatAutomationDelay } from '../../game/stateCombat';
import type { GameState } from '../../game/stateTypes';
import type { GameplayTransitionSource } from './gameplay/gameplayTransitionSourceTypes';

interface UseCombatAutomationOptions {
  combat: GameState['combat'];
  gameRef: MutableRefObject<GameState>;
  playerMana: GameState['player']['mana'];
  playerStatusEffects: GameState['player']['statusEffects'];
  enemyLookup: GameState['enemies'];
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  combat,
  gameRef,
  playerMana,
  playerStatusEffects,
  enemyLookup,
  paused,
  setGame,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  const gameplayTransitionSourceRef = useRef<GameplayTransitionSource>(
    undefined!,
  );
  if (gameplayTransitionSourceRef.current === undefined) {
    gameplayTransitionSourceRef.current =
      createWorkerGameplayTransitionSource();
  }

  const latestInputsRef = useRef<UseCombatAutomationOptions>({
    combat,
    gameRef,
    playerMana,
    playerStatusEffects,
    enemyLookup,
    paused,
    setGame,
    worldTimeMsRef,
  });
  latestInputsRef.current = {
    combat,
    gameRef,
    playerMana,
    playerStatusEffects,
    enemyLookup,
    paused,
    setGame,
    worldTimeMsRef,
  };

  useEffect(
    () => () => {
      void gameplayTransitionSourceRef.current.dispose();
    },
    [],
  );

  useEffect(() => {
    if (paused || !combat?.started) return;

    let cancelled = false;
    let timeout: number | null = null;

    const scheduleNextStep = () => {
      if (cancelled) return;

      const latestInputs = latestInputsRef.current;
      if (latestInputs.paused || !latestInputs.combat?.started) {
        return;
      }

      const delay = getCombatAutomationDelay(
        {
          combat: latestInputs.combat,
          player: {
            mana: latestInputs.playerMana,
            statusEffects: latestInputs.playerStatusEffects,
          },
          enemies: latestInputs.enemyLookup,
        },
        latestInputs.worldTimeMsRef.current,
      );
      if (delay == null) {
        return;
      }

      timeout = window.setTimeout(() => {
        if (cancelled) return;

        void gameplayTransitionSourceRef.current
          .progressCombat(
            latestInputsRef.current.gameRef.current,
            latestInputsRef.current.worldTimeMsRef.current,
          )
          .then((result) => {
            if (cancelled) {
              return;
            }

            const nextInputs = latestInputsRef.current;
            nextInputs.gameRef.current = result.state;
            nextInputs.setGame(result.state);
            scheduleNextStep();
          })
          .catch((error: unknown) => {
            if (!cancelled) {
              console.error(error);
            }
          });
      }, delay);
    };

    scheduleNextStep();

    return () => {
      cancelled = true;
      if (timeout != null) {
        window.clearTimeout(timeout);
      }
    };
  }, [
    combat,
    enemyLookup,
    gameRef,
    paused,
    playerMana,
    playerStatusEffects,
    setGame,
    worldTimeMsRef,
  ]);
}
