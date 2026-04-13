import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  getCombatAutomationDelay,
  progressCombat,
  type GameState,
} from '../../game/state';

interface UseCombatAutomationOptions {
  combat: GameState['combat'];
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  combat,
  setGame,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  useEffect(() => {
    if (!combat?.started) return;
    const delay = getCombatAutomationDelay(combat, worldTimeMsRef.current);
    if (!combat || delay == null) return;

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        return progressCombat({
          ...current,
          worldTimeMs: worldTimeMsRef.current,
        });
      });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [combat, setGame, worldTimeMsRef]);
}
