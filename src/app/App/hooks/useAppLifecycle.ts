import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  setHomeHex,
  syncBloodMoon,
  syncPlayerStatusEffects,
  type GameState,
} from '../../../game/state';
import { resetTooltipState as resetTooltipStore } from '../tooltipStore';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';

interface UseAppLifecycleOptions {
  game: GameState;
  gameRef: MutableRefObject<GameState>;
  setGame: Dispatch<SetStateAction<GameState>>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTimeMinutes: number;
  worldTimeMs: number;
  worldTimeMsRef: MutableRefObject<number>;
}

export function useAppLifecycle({
  game,
  gameRef,
  setGame,
  tooltipPositionRef,
  worldTimeMinutes,
  worldTimeMs,
  worldTimeMsRef,
}: UseAppLifecycleOptions) {
  useEffect(() => {
    resetTooltipStore();
    tooltipPositionRef.current = null;

    return () => {
      resetTooltipStore();
      tooltipPositionRef.current = null;
    };
  }, [tooltipPositionRef]);

  useEffect(() => {
    setGame((current) =>
      syncBloodMoon(
        { ...current, worldTimeMs: worldTimeMsRef.current },
        worldTimeMinutes,
      ),
    );
  }, [setGame, worldTimeMinutes, worldTimeMsRef]);

  useEffect(() => {
    setGame((current) =>
      syncPlayerStatusEffects(current, worldTimeMsRef.current),
    );
  }, [setGame, worldTimeMs, worldTimeMsRef]);

  useEffect(() => {
    gameRef.current = game;
  }, [game, gameRef]);
}

export function setHomeHexForApp(setGame: Dispatch<SetStateAction<GameState>>) {
  setGame((current) => setHomeHex(current));
}
