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
  game: Pick<GameState, 'combat' | 'player' | 'enemies'>;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  game,
  setGame,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  useEffect(() => {
    const { combat } = game;
    if (!combat?.started) return;
    const delay = getCombatAutomationDelay(game, worldTimeMsRef.current);
    if (!combat || delay == null) return;

    const timeout = window.setTimeout(() => {
      setGame((current) =>
        progressCombat({
          ...current,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [game, setGame, worldTimeMsRef]);
}
