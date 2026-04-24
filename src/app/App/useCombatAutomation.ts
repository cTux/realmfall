import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  getCombatAutomationDelay,
  progressCombat,
} from '../../game/stateCombat';
import type { GameState } from '../../game/stateTypes';

interface UseCombatAutomationOptions {
  combat: GameState['combat'];
  playerMana: GameState['player']['mana'];
  playerStatusEffects: GameState['player']['statusEffects'];
  enemyLookup: GameState['enemies'];
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  combat,
  playerMana,
  playerStatusEffects,
  enemyLookup,
  paused,
  setGame,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  const latestInputsRef = useRef<UseCombatAutomationOptions>({
    combat,
    playerMana,
    playerStatusEffects,
    enemyLookup,
    paused,
    setGame,
    worldTimeMsRef,
  });
  latestInputsRef.current = {
    combat,
    playerMana,
    playerStatusEffects,
    enemyLookup,
    paused,
    setGame,
    worldTimeMsRef,
  };

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

        const nextInputs = latestInputsRef.current;
        nextInputs.setGame((current) =>
          progressCombat({
            ...current,
            worldTimeMs: nextInputs.worldTimeMsRef.current,
          }),
        );
        scheduleNextStep();
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
    paused,
    playerMana,
    playerStatusEffects,
    setGame,
    worldTimeMsRef,
  ]);
}
