import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { setHomeHex, type GameState } from '../../../game/state';
import { resetTooltipState as resetTooltipStore } from '../tooltipStore';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';

interface UseAppLifecycleOptions {
  game: GameState;
  gameRef: MutableRefObject<GameState>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
}

export function useAppLifecycle({
  game,
  gameRef,
  tooltipPositionRef,
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
    gameRef.current = game;
  }, [game, gameRef]);
}

export function setHomeHexForApp(setGame: Dispatch<SetStateAction<GameState>>) {
  setGame((current) => setHomeHex(current));
}
