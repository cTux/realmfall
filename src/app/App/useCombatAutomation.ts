import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { attackCombatEnemy, type GameState } from '../../game/state';

interface UseCombatAutomationOptions {
  combat: GameState['combat'];
  combatEnemyCount: number;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  combat,
  combatEnemyCount,
  setGame,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  useEffect(() => {
    if (!combat || combatEnemyCount === 0) return;

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        const enemyId = current.combat?.enemyIds[0];
        return enemyId
          ? attackCombatEnemy(
              { ...current, worldTimeMs: worldTimeMsRef.current },
              enemyId,
            )
          : current;
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [combat, combatEnemyCount, setGame, worldTimeMsRef]);
}
