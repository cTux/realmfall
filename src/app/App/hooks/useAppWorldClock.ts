import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { GameState } from '../../../game/state';
import { syncBloodMoon, syncPlayerStatusEffects } from '../../../game/state';
import { useWorldClockFps } from '../useWorldClockFps';

export function useAppWorldClock({
  initialWorldTimeMs,
  lastDisplayedWorldSecondRef,
  paused,
  setGame,
  worldTimeMsRef,
  worldTimeTickRef,
}: {
  initialWorldTimeMs: number;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
  paused: boolean;
  setGame: Dispatch<SetStateAction<GameState>>;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
}) {
  const handleWorldSecondChange = useCallback(() => {
    setGame((current) =>
      syncPlayerStatusEffects(current, worldTimeMsRef.current),
    );
  }, [setGame, worldTimeMsRef]);

  const handleWorldMinuteChange = useCallback(
    (worldTimeMinutes: number) => {
      setGame((current) =>
        syncBloodMoon(
          { ...current, worldTimeMs: worldTimeMsRef.current },
          worldTimeMinutes,
        ),
      );
    },
    [setGame, worldTimeMsRef],
  );

  return useWorldClockFps({
    initialWorldTimeMs,
    paused,
    worldTimeMsRef,
    worldTimeTickRef,
    lastDisplayedWorldSecondRef,
    onWorldMinuteChange: handleWorldMinuteChange,
    onWorldSecondChange: handleWorldSecondChange,
  });
}
