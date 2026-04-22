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
  playerStatusEffects: GameState['player']['statusEffects'];
  enemyLookup: GameState['enemies'];
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  combat,
  playerStatusEffects,
  enemyLookup,
  paused,
  setGame,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  useEffect(() => {
    if (paused) return;

    if (!combat?.started) return;
    const delay = getCombatAutomationDelay(
      {
        combat,
        player: { statusEffects: playerStatusEffects },
        enemies: enemyLookup,
      },
      worldTimeMsRef.current,
    );
    if (delay == null) return;

    const timeout = window.setTimeout(() => {
      setGame((current) =>
        progressCombat({
          ...current,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    combat,
    enemyLookup,
    paused,
    playerStatusEffects,
    setGame,
    worldTimeMsRef,
  ]);
}
