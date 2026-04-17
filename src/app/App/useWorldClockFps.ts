import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  type SetStateAction,
  type MutableRefObject,
} from 'react';
import { getWorldTimeMinutesFromTimestamp } from '../../ui/world/timeOfDay';
import { setWorldClockTime } from './worldClockStore';

interface UseWorldClockFpsOptions {
  initialWorldTimeMs: number;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
  onWorldMinuteChange?: (worldTimeMinutes: number) => void;
  onWorldSecondChange?: () => void;
}

export function useWorldClockFps({
  initialWorldTimeMs,
  worldTimeMsRef,
  worldTimeTickRef,
  lastDisplayedWorldSecondRef,
  onWorldMinuteChange,
  onWorldSecondChange,
}: UseWorldClockFpsOptions) {
  const lastWorldTimeMinutesRef = useRef(
    getWorldTimeMinutesFromTimestamp(initialWorldTimeMs),
  );
  const syncWorldTime = useEffectEvent((nextWorldTimeMs: number) => {
    const nextWorldTimeMinutes =
      getWorldTimeMinutesFromTimestamp(nextWorldTimeMs);
    setWorldClockTime(nextWorldTimeMs);
    onWorldSecondChange?.();
    if (nextWorldTimeMinutes !== lastWorldTimeMinutesRef.current) {
      lastWorldTimeMinutesRef.current = nextWorldTimeMinutes;
      onWorldMinuteChange?.(nextWorldTimeMinutes);
    }
  });

  useEffect(() => {
    let frameId = 0;
    setWorldClockTime(initialWorldTimeMs);

    const updateHud = (timestamp: number) => {
      const lastTick = worldTimeTickRef.current;
      if (lastTick != null) {
        worldTimeMsRef.current += timestamp - lastTick;
      }
      worldTimeTickRef.current = timestamp;

      const displayedWorldSecond = Math.floor(worldTimeMsRef.current / 1000);
      if (displayedWorldSecond !== lastDisplayedWorldSecondRef.current) {
        lastDisplayedWorldSecondRef.current = displayedWorldSecond;
        syncWorldTime(worldTimeMsRef.current);
      }

      frameId = window.requestAnimationFrame(updateHud);
    };

    frameId = window.requestAnimationFrame(updateHud);
    return () => {
      worldTimeTickRef.current = null;
      window.cancelAnimationFrame(frameId);
    };
  }, [
    initialWorldTimeMs,
    lastDisplayedWorldSecondRef,
    syncWorldTime,
    worldTimeMsRef,
    worldTimeTickRef,
  ]);

  const setWorldTimeMs = useCallback(
    (nextWorldTimeMs: SetStateAction<number>) => {
      const resolvedWorldTimeMs =
        typeof nextWorldTimeMs === 'function'
          ? nextWorldTimeMs(worldTimeMsRef.current)
          : nextWorldTimeMs;
      worldTimeMsRef.current = resolvedWorldTimeMs;
      lastDisplayedWorldSecondRef.current = Math.floor(
        resolvedWorldTimeMs / 1000,
      );
      lastWorldTimeMinutesRef.current =
        getWorldTimeMinutesFromTimestamp(resolvedWorldTimeMs);
      setWorldClockTime(resolvedWorldTimeMs);
    },
    [lastDisplayedWorldSecondRef, worldTimeMsRef],
  );

  return {
    setWorldTimeMs,
  };
}
