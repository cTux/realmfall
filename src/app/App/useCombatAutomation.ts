import { useEffect, type MutableRefObject } from 'react';
import { getCombatAutomationDelay, type GameState } from '../../game/state';
import { gameActions } from '../store/gameSlice';
import { useAppDispatch } from '../store/hooks';

interface UseCombatAutomationOptions {
  combat: GameState['combat'];
  worldTimeMsRef: MutableRefObject<number>;
}

export function useCombatAutomation({
  combat,
  worldTimeMsRef,
}: UseCombatAutomationOptions) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!combat?.started) return;
    const delay = getCombatAutomationDelay(combat, worldTimeMsRef.current);
    if (!combat || delay == null) return;

    const timeout = window.setTimeout(() => {
      dispatch(
        gameActions.progressCombatAtTime({
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [combat, dispatch, worldTimeMsRef]);
}
